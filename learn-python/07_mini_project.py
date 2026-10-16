# LESSON 7: MINI PROJECT, the dial indicator in Python (about 15 minutes)
#
# ▶ RUN IT:  python3 07_mini_project.py
#    Type 1, 2 or 3 and press Enter to slide that block under the gauge.
#    Type q to quit.
#
# Everything here is something you've already learned, plus two new things:
#   input()  waits for the user to type something and gives it back as text
#   while True:  is a loop that repeats forever until  break

BLOCKS = [18, 14, 10]
PER_TURN = 20


def readout(choice):
    if 1 <= choice <= len(BLOCKS):
        height = BLOCKS[choice - 1]
        return f"block {choice} · reads {height:.1f} px"
    return "between blocks"


def gauge_bar(choice):
    # Draw the reading as a bar of # marks, one per px of height.
    if 1 <= choice <= len(BLOCKS):
        return "#" * BLOCKS[choice - 1]    # "#" * 3 gives "###"
    return ""


print("DIAL INDICATOR. Pick a block: 1, 2 or 3  (q to quit)")

while True:
    typed = input("> ")

    if typed == "q":
        print("Bye!")
        break

    if not typed.isdigit():          # isdigit() checks "is this a whole number?"
        print("Please type 1, 2, 3 or q")
        continue                     # skip to the next round of the loop

    choice = int(typed)              # int() turns the text "2" into the number 2
    print(readout(choice))
    print(gauge_bar(choice))

# ✏️ CHANGE ONE THING:
#    Add a 4th block to BLOCKS. Does the rest of the program still work?
#    (It should, because nothing else had the number 3 hard-coded. That's
#    good design, and it's how the repo's figures are built too.)
#
# ✅ WIN: You built an interactive program from scratch concepts. Go tick
#    every box in PROGRESS.md.
#
# 🚀 NEXT: Ask Claude to "give me lesson 8" for dictionaries, using the
#    raptor-engine example's parts list.
