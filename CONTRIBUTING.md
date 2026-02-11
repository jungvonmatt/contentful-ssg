# Contributing to Contentful SSG

✨ Thanks for contributing to contentful-ssg! ✨

## How can I contribute?

Of course. We appreciate all of our [contributors](https://github.com/jungvonmatt/contentful-ssg/graphs/contributors) and
welcome contributions to improve the project further. If you're uncertain whether an addition should be made, feel
free to open up an issue and we can discuss it.

### Improve documentation

As a user of contentful-ssg you're the perfect candidate to help us improve our documentation. Typo corrections, error fixes, better explanations, more examples, etc. Open issues for things that could be improved. Anything. Even improvements to this document.

Use the [`scope:documentation` label](https://github.com/jungvonmatt/contentful-ssg/labels/scope%3Adocumentation) to find suggestions for what we'd love to see more documentation on.

### Improve issues

Some issues are created with missing information, not reproducible, or plain invalid. Help make them easier to resolve. Handling issues takes a lot of time that we could rather spend on fixing bugs and adding features.

### Give feedback on issues

We're always looking for more opinions on discussions in the issue tracker. It's a good opportunity to influence the future direction of AVA.

The [`question`](https://github.com/jungvonmatt/contentful-ssg/labels/question) labels are a good place to find ongoing discussions.

### Help out

You can use issue labels to discover issues you could help out with:

* [`bug` issues](https://github.com/jungvonmatt/contentful-ssg/labels/bug) are known bugs we'd like to fix
* [`enhancement` issues](https://github.com/jungvonmatt/contentful-ssg/labels/enhancement) are features we're open to including

The [`help wanted`](https://github.com/jungvonmatt/contentful-ssg/labels/help%20wanted) and [`good for beginner`](https://github.com/jungvonmatt/contentful-ssg/labels/good%20first%20issue) labels are especially useful.

You may find an issue is assigned. Please double-check before starting on this issue because somebody else is likely already working on it.

Read on for tips on contributing code.

## Contributing code

Once you find an issue you'd like to work on leave a comment so others are aware. We'll then assign you to the issue.

Of course you can work on things that do not yet have an issue. However if you're going to be putting in a lot of effort it's best to discuss it first.

When you're ready to get feedback on your work, open a [draft pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests#draft-pull-requests). It's fine if the work's not yet done, but please do let us know what's remaining. This lets reviewers know not to nit-pick small details or point out improvements you already know you need to make.

Reviewing large pull requests can take a lot of time. Time that may not always be available. Smaller pull requests may land more quickly. If you're introducing a new feature think about how it might be broken up.

Try and avoid making breaking changes. Those take more time to ship. Instead make the new behavior opt-in. This way your feature can ship, and you can use it, on its own schedule.

Features should be accompanied with tests and documentation.

Don't include unrelated changes in your pull request. Make sure tests pass on your machine by running `pnpm test`. You can run specific test files as well using `pnpm run test -- packages/.../{file}.js`.

When you make a pull request please use a clear and descriptive title. Be specific about what's changed and why.

Please make sure the *Allow edits from maintainers* box is checked. That way we can make certain minor changes ourselves, allowing your pull request to be merged sooner.

You might be asked to make changes to your pull request. There's never a need to open another pull request. Push more commits to your existing branch. We'll squash them when we merge the PR.

Dependencies are managed using `pnpm`. Only update dependencies when needed for your pull request. Don't rebuild the lockfile.

And finally, have fun!
