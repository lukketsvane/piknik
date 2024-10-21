import os

def write_specific_file_contents(root_dir, output_file, file_list):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for file_path in file_list:
            full_path = os.path.join(root_dir, file_path)
            if os.path.exists(full_path):
                outfile.write(f"File: {file_path}\n\n")
                
                with open(full_path, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    outfile.write(content)
                
                outfile.write("\n\n" + "="*80 + "\n\n")
            else:
                print(f"Warning: File not found - {file_path}")

if __name__ == "__main__":
    root_directory = "."  # Current directory
    output_file = "project_contents.txt"
    
    files_to_include = [
        "app/[code]/page.tsx",
        "app/layout.tsx",
        "app/page.tsx",
        "components/add-ingredient-dialog.tsx",
        "components/ingredient-list.tsx",
        "components/initial-card.tsx",
        "components/piknik.tsx",
        "components/recipe-history.tsx",
        "components/recipe-modal.tsx",
        "components/user-avatar.tsx",
        "hooks/use-audio.ts",
        "hooks/use-ingredients.ts",
        "hooks/use-recipes.ts",
        "hooks/use-session.ts",
        "lib/utils.ts"
    ]
    
    write_specific_file_contents(root_directory, output_file, files_to_include)
    print(f"Contents of specified files have been written to {output_file}")