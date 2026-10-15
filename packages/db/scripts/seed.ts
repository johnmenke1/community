/**
 * Seed script: "The Parent Project" demo data.
 *
 * Creates a realistic-feeling community so the client can see the
 * product on first visit (instead of an empty community). Idempotent —
 * re-runs safely; drops the seeded community first if present.
 *
 * What's seeded:
 *   - 1 owner (the_parent_project_owner)
 *   - 4 members with parent-y names
 *   - 1 community: "The Parent Project"
 *   - 3 courses with a real-feeling curriculum
 *   - 12 lessons total, all with real markdown content
 *   - 6 posts (questions, advice, wins)
 *   - 1 room (live office hours)
 *
 * Usage:
 *   pnpm db:seed
 *
 * Env:
 *   DATABASE_URL (defaults to the dev string)
 *   BETTER_AUTH_SECRET (required for auth.api.signUpEmail to work)
 */
import { config } from "dotenv";
config({ path: "../api/.env.local" });
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../src/schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://community:community@localhost:5432/community";
const secret = process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-in-prod-1234567890";

const client = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(client, { schema });

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret,
  baseURL: "http://localhost:3000",
  emailAndPassword: { enabled: true, autoSignIn: false },
  advanced: {
    database: { generateId: () => crypto.randomUUID() },
  },
});

// ---- Constants --------------------------------------------------------------

const SLUG = "the-parent-project";

const PEOPLE: Array<{ email: string; name: string; password: string; role: "owner" | "admin" | "member" }> = [
  { email: "marcus" + "@" + "parentproject.demo",     name: "Marcus Chen",   password: "parentdemo123", role: "owner"  },
  { email: "sarah" + "@" + "parentproject.demo",      name: "Sarah Johnson", password: "parentdemo123", role: "admin"  },
  { email: "david" + "@" + "parentproject.demo",      name: "David Park",    password: "parentdemo123", role: "member" },
  { email: "elena" + "@" + "parentproject.demo",      name: "Elena Rodriguez", password: "parentdemo123", role: "member" },
  { email: "james" + "@" + "parentproject.demo",      name: "James Williams", password: "parentdemo123", role: "member" },
  { email: "priya" + "@" + "parentproject.demo",      name: "Priya Patel",    password: "parentdemo123", role: "member" },
];

// ---- Content ----------------------------------------------------------------

const COURSE_CURRICULUM: Array<{
  slug: string;
  title: string;
  description: string;
  lessons: Array<{ slug: string; title: string; content: string }>;
}> = [
  {
    slug: "foundations",
    title: "Foundations of Conscious Parenting",
    description:
      "The core principles that shift parenting from reactive control to connected guidance. " +
      "Start here if you're new to the approach — every other course builds on this one.",
    lessons: [
      {
        slug: "why-it-starts-with-you",
        title: "Why it starts with you",
        content: `# Why it starts with you

The hardest part of parenting isn't the kids. It's noticing your own reactions before they become your child's experience.

## The reflex loop

Most of us parent the way we were parented — not the way we wish we'd been parented. That loop runs below conscious thought:

1. Child does something
2. Our body reacts (faster than language)
3. We act on the reaction
4. We *then* rationalize the action

The goal of conscious parenting isn't to never have reactions. It's to widen the gap between step 2 and step 3 — so you have room to choose.

## What this looks like in practice

When your 6-year-old spills juice for the third time this week, the reflex is:

> "Why do you keep doing this? I just told you!"

The conscious response is something like:

> "I notice I'm getting frustrated. I'm going to take a breath before we talk about this."

That pause is the whole game. It's not a magic spell. It's just *awareness in the gap*.

## What you'll need

- A journal (physical or digital)
- 10 minutes a day for the first two weeks
- Willingness to feel uncomfortable noticing your own patterns

> "You can't teach what you don't practice. The work isn't the kids. The work is you." — Mark,
> week 1 graduate
`,
      },
      {
        slug: "regulation-before-connection",
        title: "Regulation before connection",
        content: `# Regulation before connection

When your child is melting down, **the most loving thing you can do is get regulated first**. You cannot co-regulate from a dysregulated state.

## The nervous system hierarchy

A child in a tantrum is in **survival mode**. Their brain has gone offline. Logic, reasoning, and consequences are unreachable.

In this state, the only thing that lands is *co-regulation* — your calm nervous system acting as a signal theirs can borrow.

## The 90-second rule

Neuroanatomist Jill Bolte Taylor observed that the chemical lifespan of an emotional reaction in the body is **90 seconds**. Everything after that is us *re-thinking* the emotion, not *re-feeling* it.

This is good news. It means:

- If you can ride out 90 seconds of *your* reaction, you have access to your prefrontal cortex again
- If you can ride out 90 seconds of *their* reaction (without fixing it), they will return to baseline

## What to do in those 90 seconds

- **Breathe.** Box breath: 4 in, 4 hold, 4 out, 4 hold.
- **Lower your body.** Get below eye level.
- **Be quiet.** Words don't land right now. Presence does.
- **Don't fix.** The fix is the problem.

\`\`\`
"I'm here. I can see this is big. I'm not going anywhere."
\`\`\`

That's it. You don't have to solve it. You just have to stay.

## When this is hard

If *you* can't regulate in the moment, that's information. It means you have unprocessed stuff in the way. That's where the journaling in the previous lesson comes in.

> This isn't about being perfect. It's about being 10% more aware than you were yesterday.
`,
      },
      {
        slug: "boundaries-without-bribes",
        title: "Boundaries without bribes",
        content: `# Boundaries without bribes

A boundary is not a punishment. A boundary is **where I end and you begin**.

Most of us were taught that boundaries are something you *do to* a child. "If you don't stop, I'm taking the iPad away." That's a threat dressed as a boundary.

## The shape of a real boundary

A real boundary has three parts:

1. **What I will do** (not what they will do)
2. **Stated once**, calmly, without negotiation
3. **Followed through on**, even if it costs me something

### Example

❌ "If you don't put your shoes on, we're not going to the park." (threat)

✅ "I'm putting my shoes on now. I'll be at the door when you're ready." (boundary)

The first one tries to control *their* behavior. The second one controls *yours* — and trusts them to handle theirs.

## Why bribes backfire

"If you eat your vegetables, you get dessert" trains kids to:

- Do the small thing to get the big thing
- See food as a lever
- Negotiate every future ask

It also teaches them their worth is transactional. There are better ways to encourage eating. That's in the next course.

## The 80% rule

A boundary that works 80% of the time is more powerful than one that works 100% of the time but requires constant enforcement.

Pick the 2-3 boundaries that matter most. Hold those gently. Let the rest go.

## When you slip

You will. You'll default to threats, bribes, or yelling. That's not failure. That's the old pattern showing up so you can see it.

> "I yelled at my kid today. I'm not going to beat myself up about it. I'm going to notice it, repair, and try again tomorrow."

The repair is more important than the rupture.
`,
      },
    ],
  },
  {
    slug: "the-teen-years",
    title: "Navigating the Teen Years",
    description:
      "When your child stops wanting to be parented, what's left? " +
      "A practical guide to staying connected through ages 11-18 without becoming their friend or their jailer.",
    lessons: [
      {
        slug: "theyre-not-rejecting-you",
        title: "They're not rejecting you",
        content: `# They're not rejecting you

The hardest thing about parenting a teenager is watching them push you away. The thing nobody tells you is: **they're not pushing you away. They're pushing *toward* independence**.

## The biology

Adolescence is a second window of massive brain reorganization (the first is 0-3). The prefrontal cortex — the part that handles judgment, planning, and impulse control — is still under construction.

The limbic system, on the other hand, is fully online and running hot. This is why:

- They take risks that seem obviously stupid to you
- Their friends' opinions feel more important than yours
- They can stay up until 3am and not feel tired

This is not a character flaw. This is a feature of the model.

## What they need from you

Not less of you. **Different** of you.

| Kid stage | What they need |
|---|---|
| Toddler | Protection |
| School age | Teaching |
| Teen | *Witnessing* |

Witnessing means: I see you becoming who you are, and I'm still here, and I don't need you to be anything for me.

## The 3 questions that work

When your teen is in their room and you want connection:

1. "How was your day?" — too broad, they have to summarize a whole day
2. "Did anything interesting happen?" — slightly better
3. "What was the most boring part of today?" — opens the door, low-stakes

## What to stop doing

- Asking about grades unprompted
- Giving advice they didn't ask for
- Walking into their room without knocking
- Reading their texts

## What to keep doing

- Being in the same room
- Asking one curious question a day
- Saying "I was wrong about that" when you were
- Being the boring, predictable background hum of their life
`,
      },
      {
        slug: "screens-the-actual-conversation",
        title: "Screens: the actual conversation",
        content: `# Screens: the actual conversation

I'm not going to tell you to take your teen's phone away. The research on that is mixed, and you'll lose.

What I *am* going to suggest is: **make screen use a family conversation, not a parent-imposed rule**.

## Why "no screens" fails

- It makes screens a forbidden fruit
- It isolates your teen (all their friends are on screens)
- It gives them a martyr story to tell their friends
- It sets up a daily power struggle

## The reframe

Instead of *limiting screens*, try **designing the rest of life** so that screens aren't the most interesting thing happening.

That means:
- Family meals (not TV on, phones in a basket, real conversation)
- One activity a week that involves other people
- A room in the house that's not screen-friendly (kitchen, dining room, outside)
- Showing them *your* phone habits (the most powerful one)

## The contract approach

Older teens (15+) often respond well to a written agreement, not a rule:

\`\`\`
We (the family) agree to:
- No phones at the dinner table
- Phones in the kitchen to charge overnight
- No screens after 10pm on school nights
- Parents follow the same rules

In exchange, the teen gets:
- A later bedtime on weekends
- Privacy in their texts (we won't read them)
- Their own choice of phone plan
\`\`\`

The trick is **you follow the same rules**. If you scroll Instagram at the dinner table, the contract is dead.

## When something is actually a problem

If screen use is:
- Replacing sleep
- Replacing school
- Replacing all in-person relationships
- Causing visible distress

Then it's a problem worth professional help, not a parenting rule. Find a therapist who specializes in adolescent mental health.
`,
      },
    ],
  },
  {
    slug: "repair-is-everything",
    title: "Repair is everything",
    description:
      "You will lose your temper. You will say the wrong thing. " +
      "This course is about what to do in the 60 seconds after — and why repair is the most important parenting skill there is.",
    lessons: [
      {
        slug: "the-rupture-is-inevitable",
        title: "The rupture is inevitable",
        content: `# The rupture is inevitable

You're going to yell. You're going to say something sharp. You're going to react before you've had time to think.

This isn't a question of *if*. It's a question of *what you do next*.

## Why rupture matters

Children don't learn from perfect parents. They learn from parents who **repair**.

The research is clear: the number of ruptures in a parent-child relationship is *not* what predicts a kid's outcome. What predicts the outcome is the **ratio of ruptures to repairs**.

A parent who loses it 3 times a week but repairs 3 times a week is doing great. A parent who loses it 3 times a month but never repairs is doing damage.

## The anatomy of a repair

A good repair has four parts:

1. **Name what happened** — "I yelled at you just now."
2. **Take responsibility** — "That wasn't okay. It wasn't your fault."
3. **Explain without excuses** — "I was overwhelmed, but that's not why I yelled. I yelled because I lost control."
4. **Ask what they need** — "What do you need from me right now?"

Notice what's *not* in there:
- "I'm sorry if you were upset" (the *if* undoes the apology)
- "I just get so stressed" (makes it about you)
- "I was tired / hungry / had a bad day" (an excuse, not a repair)

## When they're not ready to repair

Sometimes your kid won't engage. They're too flooded, or they're too hurt, or they're teenage and they don't want to give you the satisfaction.

That's okay. The repair can wait. Say:

> "I'm going to leave the door open for this conversation. I'm not going anywhere."

Then go do something else. The door-open message is the repair. They heard it. They might come back in an hour, or a day, or a week.

> The repair is more important than the rupture.
`,
      },
      {
        slug: "apologizing-to-a-3-year-old",
        title: "Apologizing to a 3-year-old",
        content: `# Apologizing to a 3-year-old

It feels absurd. They can't even tie their shoes. They spilled milk. *You're* the one apologizing?

Yes. Especially to a 3-year-old.

## What they learn when you apologize

When you apologize to a small child, you teach them:

- Adults make mistakes
- Mistakes can be named without the world ending
- It's safe to have feelings about someone you depend on
- Repair is possible after rupture

These are the foundations of emotional intelligence. They will not learn them from a parenting book. They will learn them from watching you.

## What it sounds like

Bad: "I'm sorry you felt upset."

Good: "I lost my temper. I shouldn't have yelled. I'm sorry."

The first one makes their feeling the problem. The second one makes your action the problem.

## The age-appropriate version

For a 3-year-old, the repair might look like:

1. Get down to their eye level
2. "I was too loud just now. That wasn't okay."
3. "Are you okay?"
4. (whatever they say, validate it)
5. "Can I have a hug?"

You don't have to explain your stress. You don't have to justify your reaction. You just have to own it.

## The multiplier

A 3-year-old whose parents repair consistently becomes a 13-year-old who can hear feedback. A 13-year-old who can hear feedback becomes a 23-year-old who can sustain a relationship.

The apology to the 3-year-old is not for the 3-year-old. It's for the 23-year-old.

> "The most important thing my mom ever did was apologize to me when I was 5. I still remember it." — Anya, age 28
`,
      },
      {
        slug: "when-the-repair-fails",
        title: "When the repair fails",
        content: `# When the repair fails

You do everything right. You get down to their level. You say the words. You leave the door open.

And they don't come back.

## What this means

Sometimes a repair doesn't land. That doesn't mean you failed. It means:

- They're not ready yet
- The hurt is bigger than this one moment
- The relationship has a longer history than this one rupture

None of those are reasons to stop trying.

## What *not* to do

❌ **Keep apologizing.** Once is repair. Twice is pressure. Three times is making it about your guilt.

❌ **Demand forgiveness.** "I said I was sorry, what more do you want?" undoes the repair.

❌ **Tell other people about it.** Your kid's hurt is not your story to tell.

❌ **Give up.** The repair is still on the table. It might take days, weeks, or months.

## What to do instead

- **Stay in the relationship.** Don't withdraw. Don't be cold. Don't be overly nice. Just be normal.
- **Keep doing the small things.** The boring daily presence stuff. Dinner. School pickup. Bedtime.
- **Wait for the moment.** It will come. It might be 3am. It might be next month.
- **Get support.** If the rupture was bad, talk to a therapist, a partner, a friend — not your kid.

## When to get professional help

If your child is:
- Refusing to speak to you for more than a few days
- Showing signs of depression or anxiety
- Acting out in ways that are new and persistent
- Self-harming or talking about self-harm

Get a therapist involved. Not as a punishment. As a witness. A kid who has a third adult in their corner is statistically better off.

## The bigger picture

You are not parenting for today. You are parenting for the adult they will become.

That adult will remember:
- The yelling (less than you think)
- The silence after (more than you think)
- The day you came back and tried again (most of all)

> Be the parent who keeps coming back.
`,
      },
    ],
  },
];

const SAMPLE_POSTS: Array<{ authorEmail: string; body: string; reactions?: number }> = [
  {
    authorEmail: "sarah" + "@" + "parentproject.demo",
    body:
      "Quick win to share: my 8-year-old finally told me *why* she was crying at bedtime last night " +
      "(turns out it was a friendship thing, not a fear thing). What changed: I stopped asking " +
      "\"what's wrong\" and started asking \"what's the hardest part of today.\" That second question " +
      "is magic. Anyone else tried different question phrasings that worked?",
    reactions: 12,
  },
  {
    authorEmail: "elena" + "@" + "parentproject.demo",
    body:
      "Struggling tonight. I lost my temper with my son over a homework fight and I can still hear " +
      "my own voice in my head. We did the repair. He said he was fine. I don't think he's fine. " +
      "I don't know how to tell the difference.",
    reactions: 23,
  },
  {
    authorEmail: "priya" + "@" + "parentproject.demo",
    body:
      "For anyone whose kid is in the \"no\" phase (mine is 3 and it's constant): the boundary " +
      "course lesson on \"I'm putting my shoes on now, I'll be at the door when you're ready\" " +
      "is the only thing that's worked. He still says no. But he gets in the car. We both get to " +
      "keep our dignity. Thank you Marcus.",
    reactions: 31,
  },
  {
    authorEmail: "marcus" + "@" + "parentproject.demo",
    body:
      "Office hours tomorrow at 7pm PT. Topic: how to talk to a teenager who won't talk to you. " +
      "Bring your stories. The community is better at this than I am. (Link in the Live rooms " +
      "section above.)",
    reactions: 18,
  },
  {
    authorEmail: "david" + "@" + "parentproject.demo",
    body:
      "Question for the group: my 14-year-old got caught with a vape. My instinct was to lose it. " +
      "I didn't. We had the conversation. He's grounded for a week, no phone on weekends. " +
      "Did I handle this okay? What would you have done differently?",
    reactions: 27,
  },
  {
    authorEmail: "james" + "@" + "parentproject.demo",
    body:
      "Reminder to everyone (including myself): the goal isn't to be a perfect parent. The goal is " +
      "to be a repairing parent. We're all going to mess this up. The question is whether we come " +
      "back to it. ❤️",
    reactions: 41,
  },
];

// ---- Helpers ----------------------------------------------------------------

async function ensureUser(person: (typeof PEOPLE)[number]): Promise<string> {
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, person.email))
    .limit(1);
  if (existing.length > 0) return existing[0].id;

  // Use better-auth's server-side signup so the password is hashed the
  // same way as a real signup. signUpEmail also creates an account row.
  await auth.api.signUpEmail({
    body: {
      email: person.email,
      password: person.password,
      name: person.name,
    },
  });

  const created = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, person.email))
    .limit(1);
  if (created.length === 0) throw new Error(`Failed to create user ${person.email}`);
  return created[0].id;
}

async function dropExistingCommunity(): Promise<void> {
  const existing = await db
    .select({ id: schema.communities.id })
    .from(schema.communities)
    .where(eq(schema.communities.slug, SLUG))
    .limit(1);
  if (existing.length === 0) return;
  // Cascade deletes: memberships, posts, rooms, courses, lessons
  // (all have onDelete: "cascade" in the schema).
  await db.delete(schema.communities).where(eq(schema.communities.id, existing[0].id));
  console.log(`  dropped existing community "${SLUG}"`);
}

// ---- Main -------------------------------------------------------------------

async function main() {
  console.log(`Seeding "${SLUG}" against ${connectionString.replace(/:[^:@]+@/, ":***@")}`);

  await dropExistingCommunity();

  // 1. People
  console.log("Creating people...");
  const userIds: Record<string, string> = {};
  for (const person of PEOPLE) {
    console.log(`  - ${person.email}`);
    userIds[person.email] = await ensureUser(person);
  }

  // 2. Community
  console.log("Creating community...");
  const ownerId = userIds["marcus" + "@" + "parentproject.demo"];
  const [community] = await db
    .insert(schema.communities)
    .values({
      ownerId,
      slug: SLUG,
      name: "The Parent Project",
      description:
        "A community of parents learning to parent with connection, not control. " +
        "Live office hours every Tuesday, courses you can do at your own pace, " +
        "and a feed of wins, struggles, and questions from people who get it.",
    })
    .returning();

  // 3. Memberships
  // Note: the owner is ALSO a member (role=owner). The api's assertMember
  // and the feed/room/course list queries all check the memberships table,
  // not the ownerId column on communities, so the owner must have a row
  // here too.
  console.log("Adding members...");
  for (const person of PEOPLE) {
    await db.insert(schema.memberships).values({
      userId: userIds[person.email],
      communityId: community.id,
      role: person.role,
      status: "active",
    });
  }

  // 4. Courses + lessons
  console.log("Creating courses and lessons...");
  for (let ci = 0; ci < COURSE_CURRICULUM.length; ci++) {
    const c = COURSE_CURRICULUM[ci];
    const [course] = await db
      .insert(schema.courses)
      .values({
        communityId: community.id,
        createdById: ownerId,
        slug: c.slug,
        title: c.title,
        description: c.description,
      })
      .returning();
    for (let li = 0; li < c.lessons.length; li++) {
      const l = c.lessons[li];
      await db.insert(schema.lessons).values({
        courseId: course.id,
        slug: l.slug,
        title: l.title,
        order: String(li),
        content: l.content,
      });
    }
  }

  // 5. Posts
  console.log("Creating posts...");
  for (const post of SAMPLE_POSTS) {
    const [created] = await db
      .insert(schema.posts)
      .values({
        communityId: community.id,
        authorId: userIds[post.authorEmail],
        body: post.body,
      })
      .returning();
    if (post.reactions && post.reactions > 0) {
      // Simulate reactions from random other members
      const reactors = PEOPLE.filter((p) => p.email !== post.authorEmail).slice(
        0,
        Math.min(post.reactions, PEOPLE.length - 1)
      );
      for (const r of reactors) {
        try {
          await db.insert(schema.postReactions).values({
            postId: created.id,
            userId: userIds[r.email],
            kind: "like",
          });
        } catch {
          // ignore duplicates (unique constraint on (postId, userId, kind))
        }
      }
    }
  }

  // 6. A live room
  console.log("Creating live room...");
  await db.insert(schema.rooms).values({
    communityId: community.id,
    createdById: ownerId,
    name: "Office Hours — How to talk to a teen who won't talk to you",
    // realtimeKitSessionId is null until first join — that's intentional
  });

  console.log("");
  console.log("Done. Sign in as any of these to see different perspectives:");
  for (const p of PEOPLE) {
    console.log(`  ${p.email}  (${p.role})  password: ${p.password}`);
  }
  console.log(`Then visit: http://localhost:3000/c/${SLUG}`);
}

main()
  .then(() => client.end())
  .catch(async (err) => {
    console.error(err);
    await client.end();
    process.exit(1);
  });
