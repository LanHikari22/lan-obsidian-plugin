
# Note Cluster Purpose

A cluster of notes has a single core note, and many peripheral notes that have exactly one context and belong to one context type
denoted by the folder they live in. The core note acts as an index for all peripheral notes, and is also the parent of all the
peripheral notes.

This gives us a method of grouping notes that is not overly recursive. Notes can belong to different clusters of activity, and they
all share a single parent. There are no grandparents possible.

As activity progresses, you will notice that new notes are spawned at the cluster level as indication of progress.

At the micro level, we have activity in the notes themselves and connections between them. 

At the meso level, we have activity in the form of progressing peripheral note spawns in the cluster.

At the macro level, we have activity creating a stream of new note clusters.

# Note Cluster Concepts

## Note Cluster Root Folder Structure

^concept-cluster-root-folder-structure

```
{NNN CORE NOTE}/
    {category1}/
        {MMM note name}
        ...
    {category2}/
    ...
    {NNN CORE NOTE}
```

A cluster root folder structure has a folder with the same name as the core note file in it. So if the
folder is called `000 Implement Feature/` so must the core note inside it directly.

There are no other files in it directly, but it can have category folders with notes inside them.

## core Note Index Heading

^concept-cluster-core-note-index-heading

A cluster core note can have an `# Index` H1 heading in its content.

It also has H2 headings for each context type and the corresponding notes in them.

It also must have an identical basename to the cluster root folder.

## peripheral Note Content Requirements

^concept-peripheral-note-content-requirements

A peripheral note must always exist within a big note folder structure [[#^concept-cluster-root-folder-structure]].

It must have the frontmatter property `parent` set to the index note in the big note folder.

## Spawning new peripheral notes

^concept-spawning-new-peripheral-notes

When a new peripheral note is spawned, it must set its frontmatter property `spawned_by` to the note that spawned it.

It must also have a dual-bridge link to the exact line where it was spawned in the spawner note.

# Design Decisions

## Why is the core note file the same name as the cluster folder?

This was set because it makes it easy to visualize it in the Obsidian graph. It makes us decouple from needing to
read folder information as well in active use. 

Clusters can be also be created seamlessly from notes on spawning new notes without changes to the content of the file link.