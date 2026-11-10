# The owner's words behind the core: items 126 onward

How they are kept, and where each item lives: `archive/instructions.md`.

126. **10 November 2026** (the core), on the rule "No agent workflows and no ultracode" in Claude's own module, told
     that the helper rules already say when helpers pay and cap them at five, and that the rule bans a tool rather
     than a behaviour:

     > Yes, but if workflows can be genuinely helpful, I don't want to ban them. We ran it on ultracode when that
     > happened, and that is no longer the case, so we might be prohibiting something that could be useful to us,
     > expert.

127. **10 November 2026** (the core). Told that a security review of a game's step 3 found that, on a machine where
     agents run side by side, the tests run the game's packages under the account that holds the GitHub token, so a
     bad package could take it; and that the fix is to run project code where no sign-in can be read:

     > And how do we do that, expert? We might either use Claude Code with Codex plugin, or Herdr.

     Told that the separation sits below either tool (a throwaway box for the tests, given a copy of the clone):

     > But I want them to have internet access? Otherwise they can't search for anything?

     Told that the agents keep full internet, and only the box holding project code has no sign-ins, with network only
     where its run needs it:

     > Yes, expertly.
