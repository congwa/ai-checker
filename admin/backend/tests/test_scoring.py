"""评分算法测试，验证相似度、90 分下限和平滑度满足业务展示规则。"""

from app.scoring import (
    calculate_distribution,
    calculate_stats,
    display_score,
    js_divergence,
    raw_similarity,
    smooth_score,
)


def test_raw_similarity_same_distribution_returns_one() -> None:
    """同一分布应被识别为完全相似，确保首次基准评分稳定为满分。"""

    distribution = calculate_distribution([1, 2, 3, 3])
    assert raw_similarity(distribution, distribution) == 1.0
    assert js_divergence(distribution, distribution) == 0.0


def test_calculate_stats_keeps_source_median_rule() -> None:
    """产品评分门面必须沿用源码统计口径，只把展示分和平滑作为额外业务规则。"""

    stats = calculate_stats([1, 2, 100, 355])

    assert stats["median"] == 100.0


def test_display_score_never_goes_below_ninety() -> None:
    """公开展示分必须遵守最低 90 分业务约束，避免前台出现过低分。"""

    assert display_score(0.0) == 90.0
    assert display_score(-2.0) == 90.0
    assert display_score(1.0) == 100.0


def test_smooth_score_uses_configurable_ema() -> None:
    """后台平滑度越高，新分数对曲线影响越小，保障公开曲线稳定。"""

    assert smooth_score(100.0, None, 65) == 100.0
    assert smooth_score(90.0, 100.0, 65) == 96.5
    assert smooth_score(90.0, 100.0, 100) == 99.5
