CREATE TABLE Todo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId UUID NOT NULL
    content TEXT NOT NULL,
    checked BOOLEAN DEFAULT FALSE
);