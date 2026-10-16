# LESSON 5: if / else (about 10 minutes)
#
# ▶ RUN IT:  python3 05_if_else.py

blocks = [18, 14, 10]

# Pretend the user picked a block number (people count from 1).
choice = 2

# IF runs its indented lines only when the condition is True.
# Comparisons:  ==  equal    !=  not equal    <  >  <=  >=
if choice >= 1 and choice <= len(blocks):
    height = blocks[choice - 1]          # convert human counting to Python counting
    print(f"block {choice} · reads {height:.1f} px")
else:
    print("between blocks")

# That's the same decision as build.mjs line 216:
#   (index < 0 ? "between blocks" : "block " + (index + 1))
# JavaScript squeezes it onto one line. Python spells it out.

# ✏️ CHANGE ONE THING:
#    Set choice to 7 and run it. Then set it to 0. Then to 3.
#
# ✅ WIN: You can say, out loud, why 7 printed "between blocks".
#
# ⭐ BONUS: add an  elif  branch that prints "tallest block!" when height is 18:
#        if height == 18:
#            print("tallest block!")
#        elif height == 10:
#            print("shortest block!")
