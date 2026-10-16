# LESSON 2: math (about 8 minutes)
#
# ▶ RUN IT:  python3 02_math.py

per_turn = 20      # one full needle turn = 20 px of plunger travel
block = 18         # the plunger is resting on an 18-tall block

# Python does math with  +  -  *  /
turns = block / per_turn
print("The needle turned", turns, "of a full turn")

# You can do math on the result and store it in a new box.
degrees = turns * 360
print("That is", degrees, "degrees")

# This is the exact idea the real figure uses: the needle angle comes from
# the block height. Look at build.mjs line 179:  needleAt(BLOCKS[0] / PER_TURN)
# Same division you just did.

# ✏️ CHANGE ONE THING:
#    Set block to 10 (the smallest block). How many degrees now?
#
# ✅ WIN: You predicted roughly what the number would be BEFORE running it.
#    (Hint: 10 is half of 20, so it's half a turn.)
#
# ⭐ BONUS: what does  block - 14  print? That's how much taller the first
#    block is than the second one.
