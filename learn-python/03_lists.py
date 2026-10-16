# LESSON 3: lists (about 10 minutes)
#
# ▶ RUN IT:  python3 03_lists.py

# A LIST holds several values in order, inside square brackets.
# This is copied straight from build.mjs line 35:  const BLOCKS = [18, 14, 10];
blocks = [18, 14, 10]

print("All blocks:", blocks)
print("How many blocks:", len(blocks))     # len() = "how many things are in it"

# You get one item with its POSITION (called an INDEX) in square brackets.
# ⚠️ The big gotcha: counting STARTS AT 0, not 1.
print("Index 0 is", blocks[0])   # 18, the first block
print("Index 1 is", blocks[1])   # 14
print("Index 2 is", blocks[2])   # 10

# That's why the real figure shows "block 1" for blocks[0]. People count
# from 1 and Python counts from 0, so the code adds 1 (build.mjs line 216).

# ✏️ CHANGE ONE THING:
#    Add  print(blocks[3])  at the bottom and run it.
#    You'll get an IndexError. Read the LAST line of the error: it's telling
#    you there's no 4th block. Now delete that line.
#
# ✅ WIN: You caused an error on purpose, read it, and fixed it.
#
# ⭐ BONUS: blocks.append(6) adds a fourth block. Print the list afterwards.
