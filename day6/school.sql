PRAGMA foreign_keys = ON;

CREATE TABLE students(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE

);

CREATE TABLE courses(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE enrolments(
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(course_id) REFERENCES courses(id),
    UNIQUE(student_id, course_id)
);

INSERT INTO students (id, name, email) VALUES
    (1, 'Amina', 'amina@example.com'),
    (2, 'Brian', 'brian@example.com'),
    (3, 'Grace', 'grace@example.com'),
    (4, 'David', 'david@example.com');


INSERT INTO courses (id, name) VALUES
    (1, 'Web Foundations'),
    (2, 'Python Programming'),
    (3, 'Database Fundamentals');

INSERT INTO enrolments (id, student_id, course_id, grade) VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'B'),
    (4, 2, 3, NULL),
    (5, 3, 3, 'A');


--ALL COURSES FOR AMINA
SELECT students.name AS student_name,
       courses.name AS course_name,
       enrolments.grade
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.id
WHERE students.name = 'Amina';


-- All students on Web Foundations
SELECT
    courses.name AS course_name,
    students.name AS student_name,
    enrolments.grade
FROM courses
JOIN enrolments ON courses.id = enrolments.course_id
JOIN students ON enrolments.student_id = students.id
WHERE courses.name = 'Web Foundations';


-- Number of students per course
SELECT
    courses.name AS course_name,
    COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id, courses.name;

-- Students with no enrolments
SELECT
    students.id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;

-- Assign a grade to enrolment 4
UPDATE enrolments
SET grade = 'B'
WHERE id = 4;

-- Check the updated enrolment
SELECT *
FROM enrolments
WHERE id = 4;