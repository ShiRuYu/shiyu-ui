#!/usr/bin/env python3
"""Generate and verify the frontend page/route reference from shiyu-ai menu seed data."""

from __future__ import annotations

import argparse
import csv
import re
from collections import defaultdict
from pathlib import Path


def sql_values(fragment: str) -> list[str]:
    return [item.strip() for item in next(csv.reader([fragment], delimiter=",", quotechar="'", skipinitialspace=True))]


def seed_rows(text: str, table: str) -> list[list[str]]:
    pattern = re.compile(rf'INSERT\s+INTO\s+"PUBLIC"\."{re.escape(table)}"\s+VALUES\((.*?)\);', re.I | re.S)
    return [sql_values(match.group(1)) for match in pattern.finditer(text)]


def canonical_menu_rows(text: str) -> list[list[str]]:
    """Read the v3 menu rows emitted by the MERGE statement in 05_navigation.sql."""
    rows = []
    for line in text.splitlines():
        value = line.strip()
        if not re.match(r"^\(20\d{2},", value):
            continue
        value = value[1:]
        if value.endswith(");"):
            value = value[:-2]
        elif value.endswith(",") or value.endswith(")"):
            value = value[:-1]
        rows.append(sql_values(value))
    return rows


def clean(value: str) -> str:
    return "" if value.upper() == "NULL" else value


FEATURE_COMPONENTS = {
    "feature:agent.admin",
    "feature:agent.apps",
    "feature:agent.execution",
    "feature:agent.intents",
    "feature:conversation.chat",
    "feature:conversation.prompts",
    "feature:education.analytics",
    "feature:education.learning",
    "feature:education.practice",
    "feature:education.tutor",
    "feature:governance.approvals",
    "feature:governance.observability",
    "feature:governance.quotas",
    "feature:iam.auth-codes",
    "feature:iam.dictionaries",
    "feature:iam.files",
    "feature:iam.menus",
    "feature:iam.roles",
    "feature:iam.tenants",
    "feature:iam.users",
    "feature:knowledge.documents",
    "feature:knowledge.evaluations",
    "feature:knowledge.graph",
    "feature:knowledge.retrieval",
    "feature:knowledge.search",
    "feature:knowledge.spaces",
    "feature:model.models",
    "feature:record.content",
    "feature:record.profiles",
    "feature:record.timeline",
    "feature:tooling.plugins",
}


def component_file(component: str) -> Path | None:
    return Path(component) if component in FEATURE_COMPONENTS else None


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    backend = root.parent / "shiyu-ai"
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--seed-file",
        default=str(backend / "shiyu-domains/iam/shiyu-iam-implementation/src/main/resources/db/baseline/h2/seed/iam/02_auth.sql"),
    )
    parser.add_argument(
        "--navigation-file",
        default=str(backend / "shiyu-domains/iam/shiyu-iam-implementation/src/main/resources/db/baseline/h2/seed/iam/05_navigation.sql"),
    )
    args = parser.parse_args()

    seed_file = Path(args.seed_file).resolve()
    if not seed_file.is_file():
        raise SystemExit(f"menu seed not found: {seed_file}")
    seed = seed_file.read_text(encoding="utf-8")
    navigation_file = Path(args.navigation_file).resolve()
    navigation = navigation_file.read_text(encoding="utf-8")
    roles = {int(row[0]): row[1] for row in seed_rows(seed, "AUTH_ROLE")}
    role_menus: dict[int, set[int]] = defaultdict(set)
    for row in seed_rows(seed, "AUTH_ROLE_SCOPE_MENU"):
        role_menus[int(row[1])].add(int(row[0]))

    menus = []
    # 02_auth.sql still contains the pre-v3 rows so an upgrade can remove them.
    # They must never appear in generated documentation or the published menu.
    system_menu_ids = {1, 2, 3, 4, 5, 7, 11, 90}
    menu_rows = [row for row in seed_rows(seed, "AUTH_MENU") if int(row[0]) in system_menu_ids]
    menu_rows.extend(canonical_menu_rows(navigation))
    for row in menu_rows:
        menu_id = int(row[0])
        menus.append(
            {
                "id": menu_id,
                "name": clean(row[1]),
                "code": clean(row[2]),
                "type": clean(row[3]),
                "parent": int(row[4]) if row[4].upper() != "NULL" else 0,
                "path": clean(row[6]),
                "component": clean(row[9]),
                "show": clean(row[15]).upper() == "TRUE",
                "roles": ", ".join(
                    roles[role_id]
                    for role_id in sorted(
                        role_menus[menu_id] or ({1, 2, 3} if menu_id >= 2000 else set())
                    )
                    if role_id in roles
                ),
            }
        )

    missing = []
    lines = [
        "# 页面路由与角色清单",
        "",
        "> 本文由 `scripts/docs/generate-page-route-reference.py` 从后端 H2 菜单基线生成。它描述空库初始化后的基线；运行时管理员可以调整角色菜单。",
        "",
        f"- 菜单总数：{len(menus)}",
        f"- 页面菜单：{sum(menu['type'] == 'MENU' for menu in menus)}",
        f"- 目录菜单：{sum(menu['type'] == 'CATALOG' for menu in menus)}",
        f"- 隐藏详情/编辑页：{sum(not menu['show'] for menu in menus)}",
        "",
        "## 完整清单",
        "",
        "> Agent 平台与知识引擎页面均通过 feature 公共入口装配。",
        "",
        "| ID | 类型 | 页面/目录 | 路由 | 组件 | 可见 | 初始角色 | 组件校验 |",
        "|---:|---|---|---|---|---|---|---|",
    ]
    for menu in sorted(menus, key=lambda item: item["id"]):
        file = component_file(menu["component"])
        if menu["type"] == "MENU" and not file:
            missing.append(f"{menu['id']} {menu['path']} -> {menu['component']}")
        component_status = "目录" if menu["type"] == "CATALOG" else ("存在" if file else "缺失")
        lines.append(
            f"| {menu['id']} | {menu['type']} | {menu['name']} | `{menu['path']}` | "
            f"`{menu['component'] or '-'}` | {'是' if menu['show'] else '否'} | {menu['roles'] or '-'} | {component_status} |"
        )

    lines.extend(
        [
            "",
            "## 使用规则",
            "",
            "- `CATALOG` 负责导航分组，不对应 Vue 页面文件。",
            "- `MENU` 的组件字段必须使用 `feature:<domain>.<page>` 语义标识，旧 views 路径会被拒绝。",
            "- 隐藏页面仍由动态路由注册，用于编辑、详情、答题和结果等上下文跳转。",
            "- 初始角色仅描述 seed 基线；实际可达性还受当前租户授权、角色状态和后端权限码约束。",
            "- 修改后端菜单 seed 或 feature 公共入口后重新执行本脚本；存在缺失组件时脚本以非零状态退出。",
            "",
        ]
    )
    output = root / "docs/参考/页面路由与角色清单.md"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"generated: menus={len(menus)}, missing_components={len(missing)}, output={output}")
    if missing:
        raise SystemExit("missing menu components:\n" + "\n".join(missing))


if __name__ == "__main__":
    main()
