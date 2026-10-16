# LESSON 1: print and variables (about 8 minutes)
#
# Lines starting with # are COMMENTS. Python skips them; they're notes for you.
#
# ▶ RUN IT:  python3 01_print_and_variables.py

# print() shows something on the screen. Text goes inside quotes.
print("Hello! This is the dial indicator.")

# A VARIABLE is a labelled box that holds a value.
# The = means "put the value on the right into the box on the left".
first_block = 18
per_turn = 20

# Leave the quotes off and print() shows what's inside the box.
print(first_block)
print("One full turn of the needle is", per_turn, "px")

# In the repo, examples/dial-indicator/build.mjs (line 28) says:
#     const PER_TURN = 20;
# That's JavaScript, but it's the same idea: a labelled box holding 20.

# ✏️ CHANGE ONE THING:
#    Change 18 above to 25 and run the file again. What printed differently?
#
# ✅ WIN: You changed a value and saw the output change. You're a programmer now.
#
# ⭐ BONUS (optional): make a variable called machine_name that holds the text
#    "dial indicator" (in quotes), then print it.
