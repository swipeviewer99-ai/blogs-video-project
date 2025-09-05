# YouTube Video Metadata Generator

This project contains a script to automatically generate SEO-optimized metadata for YouTube videos based on an Excel file input.

## Description

The `generate_metadata.py` script processes an Excel file named `SEOVideos.xlsx` located in the `assets` directory. For each video entry in the file, it generates a compelling YouTube Title, a detailed Description, and a list of relevant Tags.

The final output is an updated Excel file with three new columns: `YouTube Title`, `YouTube Description`, and `YouTube Tags`.

## How to Use

### Prerequisites

- Python 3.x
- pandas
- openpyxl

### Installation

1.  Install the required Python libraries:
    ```bash
    pip install pandas openpyxl
    ```

### Running the Script

1.  Make sure your input data is in `assets/SEOVideos.xlsx`.
2.  Run the script from the root directory of the project:
    ```bash
    python generate_metadata.py
    ```
3.  The script will overwrite the `assets/SEOVideos.xlsx` file with the newly generated metadata columns.

**Note:** The output file `assets/SEOVideos.xlsx` is not tracked by git. See the `.gitignore` file for more details.
