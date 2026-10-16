# LESSON 4: loops (about 10 minutes)
#
# ▶ RUN IT:  python3 04_loops.py

blocks = [18, 14, 10]
per_turn = 20

# A FOR LOOP runs the indented lines once for each item in the list.
# Each time around, the box called  height  holds the next item.
for height in blocks:
    print("This block is", height, "tall")

# ⚠️ The INDENT (4 spaces) is how Python knows which lines are inside the loop.

print("---")

# f-strings: put f before the quotes and drop variables in using {curly braces}.
# Writing  :.1f  means "show 1 decimal place", just like the real readout.
for height in blocks:
    turns = height / per_turn
    print(f"reads {height:.1f} px, needle at {turns:.2f} turns")

# ✏️ CHANGE ONE THING:
#    Add a 4th number to the blocks list. Notice that you did NOT have to
#    write a new print line, because the loop handles it.
#
# ✅ WIN: One list change, and the output grew by itself.
#
# ⭐ BONUS: Python can count for you with enumerate():
#        for index, height in enumerate(blocks):
#            print(f"block {index + 1} reads {height:.1f} px")
