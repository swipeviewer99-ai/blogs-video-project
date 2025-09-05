import pandas as pd
import re

def generate_youtube_title(resume_title):
    """
    Generates an SEO-friendly YouTube title.
    """
    title = f"How to Create a {resume_title} in 2 Mins | ResumeGemini"
    if len(title) > 70:
        # Fallback for very long titles to respect character limits
        title = f"Build a {resume_title} | ResumeGemini"
    return title

def generate_youtube_description(row):
    """
    Generates a detailed YouTube description from a template.
    """
    resume_title = row['Title']
    # Handle cases where skills might be missing or not a string
    skills = str(row['Skills']) if pd.notna(row['Skills']) else ''

    # Get first 3 skills, handle case with fewer than 3 skills
    skill_list_for_para = skills.split(',')
    first_three_skills = ', '.join(skill_list_for_para[:3])

    # Create camelCase hashtag for job role
    job_role_camel_case = ''.join(word.capitalize() for word in re.findall(r'\w+', resume_title))

    # Create a formatted list of all skills for the description
    all_skills_list_str = "\n".join([f"- {skill.strip()}" for skill in skill_list_for_para if skill.strip()])

    description = f"""Struggling to write the perfect {resume_title}? This quick video shows you how to create a professional resume in minutes using ResumeGemini!

Watch as we build a job-winning {resume_title} from scratch, highlighting key sections and how to effectively showcase your skills in {first_three_skills}, and more.

✨ Ready to build your own? Visit ResumeGemini now and create your perfect resume for FREE: https://www.resumegemini.com

Key skills covered in this resume:
{all_skills_list_str}

#Hashtags
#{job_role_camel_case}Resume #{job_role_camel_case} #ResumeTips #ResumeBuilder #ResumeGemini
---
About ResumeGemini:
ResumeGemini.com is the fastest and most efficient way to build a professional resume that gets you noticed. Our intuitive platform helps you create, customize, and download stunning resumes tailored to your dream job. Join thousands of successful professionals and give your career an edge!
"""
    return description

def get_broad_category_tags(title):
    """
    Generates broad category tags based on job title keywords.
    """
    broad_tags = []
    title_lower = title.lower()
    if any(keyword in title_lower for keyword in ['developer', 'engineer', 'software']):
        broad_tags.extend(['software engineer resume', 'IT resume', 'tech resume'])
    if 'manager' in title_lower:
        broad_tags.append('management resume')
    if 'analyst' in title_lower:
        broad_tags.extend(['data science resume', 'business analyst resume'])
    if 'marketing' in title_lower:
        broad_tags.append('marketing resume')
    if 'sales' in title_lower:
        broad_tags.append('sales resume')
    if 'director' in title_lower:
        broad_tags.append('director level resume')
    return broad_tags

def generate_youtube_tags(row):
    """
    Generates a comma-separated list of YouTube tags, respecting the 500-char limit.
    """
    resume_title = row['Title']
    skills = str(row['Skills']) if pd.notna(row['Skills']) else ''

    tags = []

    # Specific job title tags
    tags.append(f"{resume_title.lower()} resume")
    tags.append(f"how to make a {resume_title.lower()} resume")

    # Broader job category tags
    tags.extend(get_broad_category_tags(resume_title))

    # Individual skill tags
    skill_list = [skill.strip() for skill in skills.split(',') if skill.strip()]
    tags.extend(skill_list)

    # Generic action-oriented tags
    tags.extend([
        "how to write a resume", "resume writing", "resume builder", "cv format",
        "resume template", "free resume builder", "professional resume"
    ])

    # Branded tags
    tags.extend(["ResumeGemini", "ResumeGemini.com"])

    # Remove duplicates while preserving order
    unique_tags = list(dict.fromkeys(tags))

    # Join tags and enforce 500-character limit
    final_tags_str = ""
    for tag in unique_tags:
        # Check if adding the next tag exceeds the limit
        if len(final_tags_str) + len(tag) + 1 > 500:
            break
        if final_tags_str:
            final_tags_str += f",{tag}"
        else:
            final_tags_str = tag

    return final_tags_str

def main():
    """
    Main function to run the script.
    """
    excel_path = 'assets/SEOVideos.xlsx'
    try:
        df = pd.read_excel(excel_path)

        # Generate the new columns
        df['YouTube Title'] = df['Title'].apply(generate_youtube_title)
        df['YouTube Description'] = df.apply(generate_youtube_description, axis=1)
        df['YouTube Tags'] = df.apply(generate_youtube_tags, axis=1)

        # Save the updated DataFrame back to the Excel file
        df.to_excel(excel_path, index=False)

        print(f"Successfully updated '{excel_path}' with new YouTube metadata columns.")
        print("\nPreview of the first 5 rows of new data:")
        print(df[['Title', 'YouTube Title', 'YouTube Tags']].head())

    except FileNotFoundError:
        print(f"Error: The file at '{excel_path}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
