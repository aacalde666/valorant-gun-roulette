import os
import zipfile

dist_dir = 'dist'
output_opk = 'valorant-gun-challenge.opk'

if os.path.exists(output_opk):
    os.remove(output_opk)

with zipfile.ZipFile(output_opk, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            full_path = os.path.join(root, file)
            # Use forward slashes inside zip archive (essential for Overwolf/Chromium parser)
            rel_path = os.path.relpath(full_path, dist_dir).replace('\\', '/')
            z.write(full_path, arcname=rel_path)

print(f"OPK packed cleanly: {output_opk} ({os.path.getsize(output_opk)} bytes)")
