-- Insert default roles
INSERT INTO role (role) VALUES 
    ('Professor'),
    ('TA'),
    ('Tutor'),
    ('Team Leader'),
    ('Student')
ON CONFLICT (role) DO NOTHING;