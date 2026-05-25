# StudyLift School Portal Prototype

Standalone frontend prototype for a Year 7 student support portal.

## What it includes

- landing page with student sign-in shell
- Year 7 subject dashboard
- document table with upload support
- `Read` and `Listen` actions for documents
- AI-style guidance box for subject questions
- assessments with multiple attached documents
- practice activity cards for each subject
- weekly text documents split into separate rows when upload content contains multiple `Week X` sections

## Run locally

Because this prototype is plain HTML, CSS, and JavaScript, you can open [index.html](/Users/amywoolley/art_project/school-portal/index.html) directly in a browser or serve the folder with any static file server.

## Notes

- sign-in is mocked for prototype use
- browser speech synthesis is used for the listen feature
- text-based uploads (`.txt`, `.md`, `.csv`) can be previewed and split by week
- other uploaded files are tracked and attachable to assessments, but not yet parsed for preview audio
