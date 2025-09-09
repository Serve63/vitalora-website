#!/bin/bash

# Script to add favicon to all HTML files
FAVICON_LINES='    <link rel="icon" type="image/webp" href="/assets/images/vitalora logo.webp">
    <link rel="shortcut icon" type="image/webp" href="/assets/images/vitalora logo.webp">'

# Find all HTML files and add favicon
find . -name "*.html" -type f | while read file; do
    # Skip if already has favicon
    if grep -q "vitalora logo.webp" "$file"; then
        echo "Skipping $file - already has favicon"
        continue
    fi
    
    # Add favicon after theme-color meta tag
    if grep -q "theme-color" "$file"; then
        sed -i '' "/theme-color/a\\
$FAVICON_LINES" "$file"
        echo "Added favicon to $file"
    else
        # If no theme-color, add after viewport meta tag
        if grep -q "viewport" "$file"; then
            sed -i '' "/viewport/a\\
$FAVICON_LINES" "$file"
            echo "Added favicon to $file (after viewport)"
        else
            # If no viewport, add after charset
            if grep -q "charset" "$file"; then
                sed -i '' "/charset/a\\
$FAVICON_LINES" "$file"
                echo "Added favicon to $file (after charset)"
            else
                echo "Skipping $file - no suitable insertion point"
            fi
        fi
    fi
done

echo "Favicon addition complete!"
