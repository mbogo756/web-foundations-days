# School Database Design

## Tables

- **students** stores each student's ID, name and unique email address.
- **courses** stores each course's ID and name.
- **enrolments** records which student takes which course and stores their grade. The grade can be NULL when it has not been assigned.

## Relationships

One student can have many enrolments, but each enrolment belongs to one student. This is a one-to-many relationship.

One course can have many enrolments, but each enrolment belongs to one course. This is also a one-to-many relationship.

Students and courses have a many-to-many relationship: a student can take several courses, and a course can have several students. The enrolments join table connects them and stores the grade for each student on each course.

The UNIQUE constraint on (student_id, course_id) prevents a student from enrolling on the same course twice. Foreign keys ensure that enrolments reference existing students and courses.

## Suggested Index

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

This index would help the database find enrolments for a particular course faster, improving queries that list its students.

## SQL or NoSQL?

I would choose SQL because this system has structured data and clear relationships between students, courses and enrolments. SQL supports joins for retrieving related records and constraints for enforcing unique emails, valid references and unique enrolments. NoSQL can suit flexible data structures, but a relational database fits this system's requirements well.