import re
with open("/home/jerry/Downloads/Module_01_Introduction_to_Ethical_Hacking.txt", "r") as f:
    text = f.read()

# find lines matching "Module 01 Page X" to see where topics start
# or just grep for specific headers
lines = text.split('\n')
for i, line in enumerate(lines):
    if "Ethical Hacking Concepts" in line and len(line) < 40:
        print(f"Line {i}: {line}")
    elif "Hacking Methodologies" in line and len(line) < 40:
        print(f"Line {i}: {line}")
    elif "Information Security Controls" in line and len(line) < 40:
        print(f"Line {i}: {line}")
    elif "Information Security Laws" in line and len(line) < 40:
        print(f"Line {i}: {line}")
