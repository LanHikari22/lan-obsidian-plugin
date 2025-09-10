
# BigNote Purpose

We're adding big notes, are folders with categories of many small notes in which each note is exactly one context. This makes
the small notes more reusable, searchable, and focused on one purpose.

# BigNote Concepts

## BigNote Folder Structure

^concept-big-note-folder-structure

```
{NNN BIG NOTE NAME}/
    {category1}/
        {small note name}
    {category2}/
    ...
    {NNN BIG NOTE NAME}
```

A big note folder structure has a folder with the same name as the index file in it. So if the
folder is called `000 Implement Feature/` so must the index note inside it directly.

There are no other files in it, but it can have category folders, and inside each category folder,
are small notes.

## BigNote Index Heading

^concept-big-note-index-heading

An index note must always have an `# Index` H1 heading in its content to count as valid. 

It must also be the same name as its folder.

For each category specified in [[#^concept-big-note-folder-structure]], they have an H2 heading inside an `# Index` 
heading in the index file (the file with the same name as the folder).


## Small Note Content Requirements

^concept-small-note-content-requirements

A small note must always exist within a big note folder structure [[#^concept-big-note-folder-structure]].

It must have the frontmatter property `parent` set to the index note in the big note folder.

## Spawning new small notes

^concept-spawning-new-small-notes

When a new small note is spawned, it must set its frontmatter property `spawned_by` to the note that spawned it.

It must also have a dual-bridge link to the exact line where it was spawned in the spawner note.

# Design Decisions

## Why is the index file the same name as the folder?

This was set because it makes it easy to visualize it in the Obsidian graph. It makes us decouple from needing to
read folder information as well in active use.

