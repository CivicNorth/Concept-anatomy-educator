# LESSON 6: functions (about 12 minutes)
#
# ▶ RUN IT:  python3 06_functions.py

BLOCKS = [18, 14, 10]   # ALL CAPS is a convention for "this never changes"
PER_TURN = 20

# A FUNCTION is a named recipe. def creates it, and the indented lines are
# the recipe. It only runs when you CALL it by name with ().
# The word inside the () is an INPUT. return hands back the answer.
def readout(choice):
    if 1 <= choice <= len(BLOCKS):
        height = BLOCKS[choice - 1]
        return f"block {choice} · reads {height:.1f} px"
    return "between blocks"

# Now that the recipe exists, we can use it as often as we like:
print(readout(1))
print(readout(2))
print(readout(3))
print(readout(9))

# Why bother? The real figure has ONE readout calculation that everything
# shares, so the needle and the text can never disagree. The repo calls
# this "every number comes from the same model". Functions make that possible.

# ✏️ CHANGE ONE THING:
#    Write a second function  needle_degrees(choice)  that returns
#    BLOCKS[choice - 1] / PER_TURN * 360 , then print needle_degrees(1).
#
# ✅ WIN: You wrote and called your own function.
#
# Stuck? The answer is at the very bottom of this file.
#
#
#
#
#
# def needle_degrees(choice):
#     return BLOCKS[choice - 1] / PER_TURN * 360
# print(needle_degrees(1))
