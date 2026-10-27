--
-- PostgreSQL database dump
--

\restrict ElpyPSYkgZ0bITEzwvfOALXK8DwEbbT24SLOfHPvZH7uQK0L5zrrPrmBHU6qJG0

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "FK_daa193fdfccde41a2ed4de8a474";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "FK_85c0da75e5dedc5eca00055cfbe";
ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "FK_75331cd2a0f0c22bcb2fc4f6d6a";
ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "FK_3a9ba7c05e1ffba00560d11f364";
ALTER TABLE IF EXISTS ONLY public.maintenance_status_logs DROP CONSTRAINT IF EXISTS "FK_0f82b04b232c63820295efa9641";
ALTER TABLE IF EXISTS ONLY public.maintenance_status_logs DROP CONSTRAINT IF EXISTS "FK_0a46e7417830162bdaab7d4a2a9";
ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS "UQ_ec7181ebdab798d97070122a5bf";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3";
ALTER TABLE IF EXISTS ONLY public.workshops DROP CONSTRAINT IF EXISTS "UQ_84a8c763773a6482ba066f608c3";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "UQ_301c3b5fa2d49aab65dcfda36a6";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "REL_85c0da75e5dedc5eca00055cfb";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "PK_a3ffb1c0c8416b9fc6f907b7433";
ALTER TABLE IF EXISTS ONLY public.workshops DROP CONSTRAINT IF EXISTS "PK_6d0e82a124f5b53df91c8989848";
ALTER TABLE IF EXISTS ONLY public.maintenances DROP CONSTRAINT IF EXISTS "PK_62403473bd524a42d58589aa78b";
ALTER TABLE IF EXISTS ONLY public.mechanics DROP CONSTRAINT IF EXISTS "PK_2c0ed23afc0cc7ff361c17e53df";
ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS "PK_18d8646b59304dce4af3a9e35b6";
ALTER TABLE IF EXISTS ONLY public.maintenance_status_logs DROP CONSTRAINT IF EXISTS "PK_08d4922ce507b9f184dd302ba70";
ALTER TABLE IF EXISTS public.workshops ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vehicles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.mechanics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.maintenances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.maintenance_status_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.workshops_id_seq;
DROP TABLE IF EXISTS public.workshops;
DROP SEQUENCE IF EXISTS public.vehicles_id_seq;
DROP TABLE IF EXISTS public.vehicles;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.mechanics_id_seq;
DROP TABLE IF EXISTS public.mechanics;
DROP SEQUENCE IF EXISTS public.maintenances_id_seq;
DROP TABLE IF EXISTS public.maintenances;
DROP SEQUENCE IF EXISTS public.maintenance_status_logs_id_seq;
DROP TABLE IF EXISTS public.maintenance_status_logs;
DROP TYPE IF EXISTS public.vehicles_status_enum;
DROP TYPE IF EXISTS public.users_role_enum;
DROP TYPE IF EXISTS public.maintenances_type_enum;
DROP TYPE IF EXISTS public.maintenances_status_enum;
DROP TYPE IF EXISTS public.maintenance_status_logs_tostatus_enum;
DROP TYPE IF EXISTS public.maintenance_status_logs_fromstatus_enum;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: maintenance_status_logs_fromstatus_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_status_logs_fromstatus_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenance_status_logs_tostatus_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_status_logs_tostatus_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_status_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_type_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TECHNICIAN'
);


--
-- Name: vehicles_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vehicles_status_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenance_status_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_status_logs (
    id integer NOT NULL,
    "maintenanceId" integer NOT NULL,
    "fromStatus" public.maintenance_status_logs_fromstatus_enum,
    "toStatus" public.maintenance_status_logs_tostatus_enum NOT NULL,
    "changedById" integer,
    note text,
    "changedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenance_status_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_status_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_status_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_status_logs_id_seq OWNED BY public.maintenance_status_logs.id;


--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenances (
    id integer NOT NULL,
    type public.maintenances_type_enum NOT NULL,
    description text NOT NULL,
    mileage integer NOT NULL,
    "scheduledAt" timestamp with time zone NOT NULL,
    "estimatedEndAt" timestamp with time zone NOT NULL,
    status public.maintenances_status_enum DEFAULT 'SCHEDULED'::public.maintenances_status_enum NOT NULL,
    "startedAt" timestamp with time zone,
    "workPerformed" text,
    "finalCost" numeric(12,2),
    "finalMileage" integer,
    "finishedAt" timestamp with time zone,
    "vehicleId" integer NOT NULL,
    "mechanicId" integer NOT NULL,
    "workshopId" integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenances_id_seq OWNED BY public.maintenances.id;


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechanics (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    specialty character varying(80) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" integer,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mechanics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mechanics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mechanics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mechanics_id_seq OWNED BY public.mechanics.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying NOT NULL,
    role public.users_role_enum DEFAULT 'TECHNICIAN'::public.users_role_enum NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    plate character varying(10) NOT NULL,
    brand character varying(60) NOT NULL,
    model character varying(60) NOT NULL,
    year integer NOT NULL,
    mileage integer DEFAULT 0 NOT NULL,
    status public.vehicles_status_enum DEFAULT 'AVAILABLE'::public.vehicles_status_enum NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshops (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    address character varying(200) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: workshops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workshops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workshops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workshops_id_seq OWNED BY public.workshops.id;


--
-- Name: maintenance_status_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs ALTER COLUMN id SET DEFAULT nextval('public.maintenance_status_logs_id_seq'::regclass);


--
-- Name: maintenances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances ALTER COLUMN id SET DEFAULT nextval('public.maintenances_id_seq'::regclass);


--
-- Name: mechanics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics ALTER COLUMN id SET DEFAULT nextval('public.mechanics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Name: workshops id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops ALTER COLUMN id SET DEFAULT nextval('public.workshops_id_seq'::regclass);


--
-- Data for Name: maintenance_status_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_status_logs (id, "maintenanceId", "fromStatus", "toStatus", "changedById", note, "changedAt") FROM stdin;
1	1	\N	SCHEDULED	1	Mantenimiento programado	2026-09-14 08:00:00-05
2	1	SCHEDULED	IN_PROGRESS	2	\N	2026-09-15 08:05:00-05
3	1	IN_PROGRESS	COMPLETED	2	\N	2026-09-15 11:30:00-05
4	2	\N	SCHEDULED	1	Mantenimiento programado	2026-10-09 07:00:00-05
5	2	SCHEDULED	IN_PROGRESS	3	\N	2026-10-10 07:00:00-05
6	2	IN_PROGRESS	COMPLETED	3	\N	2026-10-10 09:00:00-05
7	3	\N	SCHEDULED	1	Mantenimiento programado	2026-10-26 07:30:00-05
8	3	SCHEDULED	IN_PROGRESS	3	\N	2026-10-27 07:35:00-05
\.


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenances (id, type, description, mileage, "scheduledAt", "estimatedEndAt", status, "startedAt", "workPerformed", "finalCost", "finalMileage", "finishedAt", "vehicleId", "mechanicId", "workshopId", "createdAt", "updatedAt") FROM stdin;
1	PREVENTIVE	Cambio de aceite y filtros	44800	2026-09-15 08:00:00-05	2026-09-15 11:00:00-05	COMPLETED	2026-09-15 08:05:00-05	Cambio de aceite 15W-40, filtro de aceite y filtro de aire	350000.00	45000	2026-09-15 11:30:00-05	1	1	2	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
2	CORRECTIVE	Reemplazo de pastillas de freno	52250	2026-10-10 07:00:00-05	2026-10-10 09:00:00-05	COMPLETED	2026-10-10 07:00:00-05	Cambio de pastillas delanteras y rectificación de discos	480000.00	52300	2026-10-10 09:00:00-05	1	2	1	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
3	CORRECTIVE	Revisión de ruido en la suspensión delantera	98000	2026-10-27 07:30:00-05	2026-10-27 10:00:00-05	IN_PROGRESS	2026-10-27 07:35:00-05	\N	\N	\N	\N	3	2	1	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
\.


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mechanics (id, name, email, specialty, "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
1	Carlos Pérez	carlos.perez@fleetcore.com	Motor y transmisión	t	2	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
2	Laura Gómez	laura.gomez@fleetcore.com	Frenos y suspensión	t	3	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
3	Andrés Ruiz	andres.ruiz@fleetcore.com	Sistema eléctrico	f	\N	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, "createdAt", "updatedAt") FROM stdin;
1	Administrador FleetCore	admin@fleetcore.com	$2b$10$5pJ0JrIERH77r.BJOL.RbO6c4DBvFRvKxl8WwH4nn6DT7UTdhybcW	ADMIN	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
2	Carlos Pérez	carlos.perez@fleetcore.com	$2b$10$iJak.K7Edv0PS5QXDoauNu4oNsQD3OwOyBWE7MtqOUmBPALn27fb.	TECHNICIAN	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
3	Laura Gómez	laura.gomez@fleetcore.com	$2b$10$oxFtDaHvkMUNeDJpJyxR/u4L1UvL2pGLJU9IrdCOL.yB/87KASmUu	TECHNICIAN	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, plate, brand, model, year, mileage, status, "createdAt", "updatedAt") FROM stdin;
1	ABC123	Chevrolet	NPR	2020	52300	AVAILABLE	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
2	DEF456	Renault	Kangoo	2022	30500	AVAILABLE	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
3	GHI789	Hino	Dutro	2019	98000	IN_MAINTENANCE	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
4	JKL012	Ford	Cargo 1723	2015	210000	INACTIVE	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workshops (id, name, address, "isActive", "createdAt", "updatedAt") FROM stdin;
1	Taller Centro	Calle 50 # 45-20, Medellín	t	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
2	Taller Norte	Carrera 65 # 98-10, Medellín	f	2026-10-27 08:55:52.667288-05	2026-10-27 08:55:52.667288-05
\.


--
-- Name: maintenance_status_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_status_logs_id_seq', 8, true);


--
-- Name: maintenances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenances_id_seq', 3, true);


--
-- Name: mechanics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mechanics_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 4, true);


--
-- Name: workshops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workshops_id_seq', 2, true);


--
-- Name: maintenance_status_logs PK_08d4922ce507b9f184dd302ba70; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs
    ADD CONSTRAINT "PK_08d4922ce507b9f184dd302ba70" PRIMARY KEY (id);


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: mechanics PK_2c0ed23afc0cc7ff361c17e53df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "PK_2c0ed23afc0cc7ff361c17e53df" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: mechanics REL_85c0da75e5dedc5eca00055cfb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "REL_85c0da75e5dedc5eca00055cfb" UNIQUE ("userId");


--
-- Name: mechanics UQ_301c3b5fa2d49aab65dcfda36a6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "UQ_301c3b5fa2d49aab65dcfda36a6" UNIQUE (email);


--
-- Name: workshops UQ_84a8c763773a6482ba066f608c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "UQ_84a8c763773a6482ba066f608c3" UNIQUE (name);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: vehicles UQ_ec7181ebdab798d97070122a5bf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE (plate);


--
-- Name: maintenance_status_logs FK_0a46e7417830162bdaab7d4a2a9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs
    ADD CONSTRAINT "FK_0a46e7417830162bdaab7d4a2a9" FOREIGN KEY ("changedById") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maintenance_status_logs FK_0f82b04b232c63820295efa9641; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs
    ADD CONSTRAINT "FK_0f82b04b232c63820295efa9641" FOREIGN KEY ("maintenanceId") REFERENCES public.maintenances(id) ON DELETE CASCADE;


--
-- Name: maintenances FK_3a9ba7c05e1ffba00560d11f364; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES public.mechanics(id) ON DELETE RESTRICT;


--
-- Name: maintenances FK_75331cd2a0f0c22bcb2fc4f6d6a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES public.workshops(id) ON DELETE RESTRICT;


--
-- Name: mechanics FK_85c0da75e5dedc5eca00055cfbe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "FK_85c0da75e5dedc5eca00055cfbe" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maintenances FK_daa193fdfccde41a2ed4de8a474; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict ElpyPSYkgZ0bITEzwvfOALXK8DwEbbT24SLOfHPvZH7uQK0L5zrrPrmBHU6qJG0

