import re
with open("/home/jerry/Downloads/Module_01_Introduction_to_Ethical_Hacking.txt", "r") as f:
    text = f.read()

# Try to find lines that are short and likely headers (title case, no punctuation at end)
lines = text.split("\n")
headers = []
for line in lines:
    line = line.strip()
    if 5 < len(line) < 60 and not line.endswith('.') and not line.endswith(',') and "Copyright" not in line and "Module" not in line and "Page" not in line and "Ethical Hacking" not in line:
        headers.append(line)

print("\n".join(headers[10:100]))
