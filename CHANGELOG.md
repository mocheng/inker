# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.0.2] - 2026-01-11

### Added
- Ctrl+C/Cmd+C interrupt support during LLM operations
  - Aborts current LLM request without exiting the app
  - Returns cursor to input field for immediate use
  - Exits app when pressed while idle

### Changed
- Migrated from multi-llm-ts to Vercel AI SDK
- Added AWS Bedrock support alongside Google Gemini
- Extracted LLM tools into separate files (bash, file operations, git, grep, glob, github_pr)
- Refactored slash commands to extensible CommandRegistry pattern
- Updated default Gemini model from gemini-2.0-flash-exp to gemini-2.0-flash

### Fixed
- Streaming responses now display correctly in real-time
- Autocomplete selection with Enter no longer immediately executes commands
- Added 30-second timeout with error handling for hanging LLM requests

## [0.0.1] - 2026-01-11

### Added
- Initial release
- Interactive CLI with React and Ink
- Google Gemini AI integration
- Tool support (bash, file operations, git, code search, GitHub PRs)
- Slash commands (/help, /quit, /context)
- OpenTelemetry tracing support
- Streaming AI responses
- Command autocomplete
- Input history navigation
