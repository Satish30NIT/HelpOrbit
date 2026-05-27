# HelpOrbit Database Schema

## companies

| Column       | Type         | Notes              |
|-------------|--------------|--------------------|
| id          | uuid         | PK                 |
| title       | varchar      | Company name       |
| description | text         | optional           |
| email       | varchar      | unique per tenant  |
| phone       | varchar      | optional           |
| is_active   | boolean      | default true       |
| is_deleted  | boolean      | soft delete        |
| created_at  | timestamptz  |                    |
| updated_at  | timestamptz  | trigger            |

## company_addresses

One row per company (`company_id` unique, FK → companies, ON DELETE CASCADE).

| Column             | Type         | Notes              |
|-------------------|--------------|--------------------|
| id                | uuid         | PK                 |
| company_id        | uuid         | FK → companies     |
| address_line_1    | varchar(255) | optional           |
| city              | varchar(100) | optional           |
| state             | varchar(100) | optional           |
| country           | varchar(100) | optional           |
| pin_code          | varchar(20)  | PIN / ZIP          |
| formatted_address | text         | denormalized search/display |
| created_at        | timestamptz  |                    |
| updated_at        | timestamptz  |                    |

## policies

| Column       | Type         | Notes                    |
|-------------|--------------|--------------------------|
| id          | uuid         | PK                       |
| policy_name | varchar(200) | Internal/slug name       |
| title       | varchar(200) | Display title            |
| description | text         |                          |
| company_id  | uuid         | FK → companies           |
| is_active   | boolean      | default true             |
| is_deleted  | boolean      | soft delete              |
| created_at  | timestamptz  |                          |
| updated_at  | timestamptz  | trigger                  |

## policy_acknowledgements

| Column           | Type        | Notes                              |
|-----------------|-------------|------------------------------------|
| id              | uuid        | PK                                 |
| policy_id       | uuid        | FK → policies, unique with user_id |
| user_id         | integer     | FK → users                         |
| company_id      | uuid        | FK → companies                     |
| is_acknowledged | boolean     | default false                      |
| acknowledged_at | timestamptz | null when pending                  |
| created_at      | timestamptz |                                    |
| updated_at      | timestamptz |                                    |

Unique: `(policy_id, user_id)`

Check: acknowledged state must match `acknowledged_at`.
