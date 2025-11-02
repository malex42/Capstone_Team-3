import pytest

def func(x):
    return x * 2
def test_answer():
    assert func(3) == 6
    assert func(-1) == -2
    assert func(0) == 0