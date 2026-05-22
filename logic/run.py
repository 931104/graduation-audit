from app.audit.cs_rules.cs_112 import Group, Required
from app.audit.general_rules.general_rules import General
from app.audit.general_rules.elective import Elective
from app.audit.general_rules.pc_rules import Physical

TOTAL_REQUIRED   = 128.0
REQ_REQUIRED     = 36.0
GROUP_REQUIRED   = 15.0
GENERAL_REQUIRED = 28.0
PHY_REQUIRED     = 4.0
ELEC_REQUIRED    = TOTAL_REQUIRED - REQ_REQUIRED - GROUP_REQUIRED - GENERAL_REQUIRED - PHY_REQUIRED  # 45.0

W = 52
OK = "✓"
NG = "✗"


def _flag(cond: bool) -> str:
    return OK if cond else NG


def _section(title: str):
    print(f"\n{'═' * W}")
    print(f"  {title}")
    print(f"{'═' * W}")


def print_required(ok: bool, missing: list, passed: set):
    _section("專業必修")
    print(f"  狀態        : {_flag(ok)} {'已完成' if ok else '未完成'}")
    print(f"  已通過      : {len(passed)} 門")
    if missing:
        print(f"  尚缺 ({len(missing)} 門):")
        for name in missing:
            print(f"    · {name}")


def print_group(g: dict):
    _section("專業群修")
    for group_name, credit in g["group_credits"].items():
        print(f"  {group_name}          : {credit:.1f} 學分")
    print(f"  {'─' * 40}")
    print(f"  群A >= 2 門 : {_flag(g['group_a_ok'])}")
    print(f"  BCDE >= 3 群: {_flag(g['domain_ok'])}  (已達 {g['domain_count']} 群)")
    print(f"  群修計入學分: {g['used_credits']:.1f}/15.0")
    print(f"  學分達標    : {_flag(g['credits_ok'])}")
    if g["extra_courses"]:
        print(f"  超出→計入選修: {', '.join(g['extra_courses'])}")


def print_general(res: dict):
    _section("通識")
    d = res["display"]
    print(f"  國文        : {d['國文']}")
    print(f"  英文        : {d['英文']}")
    print(f"  人文通      : {d['人文通']}")
    print(f"  社會通      : {d['社會通']}")
    print(f"  自然通      : {d['自然通']}")
    core = d["核通"]
    completed = "、".join(core["completed_domains"]) if core["completed_domains"] else "無"
    print(f"  核通        : {core['completed_count']}/{core['required_domains']} 領域  ({completed})")
    print(f"  {'─' * 40}")
    shortages = d["缺額"]
    print(f"  通識整體達標: {_flag(res['is_passed'])}")
    if any(v > 0 for v in shortages.values()):
        print("  尚缺:")
        for label, val in shortages.items():
            if val > 0:
                print(f"    · {label}: {val:.1f} 學分")


def print_physical(res: dict):
    _section("體育")
    print(f"  狀態        : {_flag(res['is_passed'])}")
    print(f"  已完成      : {res['used_credits']:.1f}/{res['required_credits']:.1f} 學分")
    if res["shortage"] > 0:
        print(f"  尚缺        : {res['shortage']:.1f} 學分")
    if res["used_courses"]:
        print(f"  已採計課程  : {', '.join(res['used_courses'])}")


def print_elective(total: float, courses: list):
    _section("自由選修")
    print(f"  總學分      : {total:.1f}")
    if courses:
        print(f"  課程 ({len(courses)} 門):")
        for name in courses:
            print(f"    · {name}")


def print_summary(req_credits, grp_credits, gen_credits, phy_credits, elec_total,
                  req_ok, grp_ok, gen_ok, phy_ok):
    elec_ok = elec_total >= ELEC_REQUIRED
    total_earned = req_credits + grp_credits + gen_credits + phy_credits + elec_total

    def row(label, earned, required, ok):
        shortage = max(0.0, required - earned)
        flag = _flag(ok)
        shortage_str = f"  (尚缺 {shortage:.1f})" if shortage > 0 else ""
        print(f"  {label:<8}  {earned:>6.1f}  /  {required:>5.1f}   {flag}{shortage_str}")

    _section("畢業審核總結")
    print(f"  {'分類':<8}  {'已獲':>6}     {'需求':>5}   狀態")
    print(f"  {'─' * 46}")
    row("專業必修", req_credits,  REQ_REQUIRED,     req_ok)
    row("專業群修", grp_credits,  GROUP_REQUIRED,   grp_ok)
    row("通識",     gen_credits,  GENERAL_REQUIRED, gen_ok)
    row("體育",     phy_credits,  PHY_REQUIRED,     phy_ok)
    row("自由選修", elec_total,   ELEC_REQUIRED,    elec_ok)
    print(f"  {'─' * 46}")
    total_ok = total_earned >= TOTAL_REQUIRED and req_ok and grp_ok and gen_ok and phy_ok and elec_ok
    row("總計",     total_earned, TOTAL_REQUIRED,   total_ok)
    print(f"\n  {'✓ 符合畢業資格' if total_ok else '✗ 尚未符合畢業資格'}")


def main():
    student_id = "112703046"

    req_ok, req_missing, req_passed, req_credits = Required(student_id)
    grp = Group(student_id)
    gen = General(student_id)
    phy = Physical(student_id)
    elec_total, elec_courses = Elective(
        student_id,
        require=req_passed,
        group=grp["used_courses"],
        general=gen,
        pc=phy,
    )

    gen_s = gen["summary"]
    gen_credits = gen_s["counted_total_credit"] + gen_s["english_credit"] + gen_s["chinese_credit"]

    print_required(req_ok, req_missing, req_passed)
    print_group(grp)
    print_general(gen)
    print_physical(phy)
    print_elective(elec_total, elec_courses)
    print_summary(
        req_credits, grp["used_credits"], gen_credits, phy["used_credits"], elec_total,
        req_ok,
        grp["credits_ok"] and grp["group_a_ok"] and grp["domain_ok"],
        gen["is_passed"],
        phy["is_passed"],
    )
    print()


if __name__ == "__main__":
    main()