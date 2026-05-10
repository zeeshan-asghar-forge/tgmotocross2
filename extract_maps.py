import json
import re

def extract_vars(filename):
    targets = ['L1B14', 'N7705', 'H9F45', 'N1F65', 'c6e75', 'J3585', 'B1795', 'c2895', 'q44F5', 'N5D43', 'F9Fe']
    results = {}
    
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            for target in targets:
                if line.strip().startswith(target + ' ='):
                    # Extract the part after '=' and before the final ';'
                    match = re.search(r'=\s*(.*);', line)
                    if match:
                        results[target] = match.group(1)
    return results

data = extract_vars('source.txt')

# Create maps.js
with open('maps.js', 'w', encoding='utf-8') as f:
    f.write('const TILE_SIZE = 32;\n\n')
    f.write(f"const trackSizes = {data['N5D43']};\n\n")
    
    for name in ['L1B14', 'N7705', 'H9F45', 'N1F65', 'c6e75', 'J3585', 'B1795', 'c2895', 'q44F5']:
        if name in data:
            f.write(f"const {name} = {data[name]};\n")
        else:
            f.write(f"const {name} = []; // NOT FOUND\n")
            
    f.write('\nconst tileMaps = [L1B14, N7705, H9F45, N1F65, c6e75, J3585, B1795, c2895, q44F5];\n\n')
    f.write(f"const F9Fe = {data['F9Fe']};\n\n")
    
    # Export to window
    f.write('window.TILE_SIZE = TILE_SIZE;\n')
    f.write('window.trackSizes = trackSizes;\n')
    f.write('window.tileMaps = tileMaps;\n')
    f.write('window.F9Fe = F9Fe;\n')

print("maps.js created successfully")
