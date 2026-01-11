# Multi-Provider LLM Setup with Vercel AI SDK

Inker now uses the Vercel AI SDK to support multiple LLM providers. You can switch between Google Gemini and AWS Bedrock by configuring your `.env` file.

## Supported Providers

- **Google Gemini** (default) - via `@ai-sdk/google`
- **AWS Bedrock** - via `@ai-sdk/amazon-bedrock`

## Configuration

Copy `.env.example` to `.env` and configure your provider:

### Google Gemini

```env
LLM_PROVIDER=google
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### AWS Bedrock

```env
LLM_PROVIDER=bedrock
AWS_REGION=us-east-1
BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
```

#### AWS Credentials Setup

AWS credentials are automatically read from `~/.aws/credentials` using the standard AWS credential chain.

**Setup with AWS CLI:**
```bash
aws configure
```

This will prompt you for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region
- Output format

**Alternative: Manual configuration**

Create or edit `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = your_access_key_id
aws_secret_access_key = your_secret_access_key
```

Create or edit `~/.aws/config`:
```ini
[default]
region = us-east-1
```

**IAM Permissions Required:**
- Your IAM user needs the `AmazonBedrockFullAccess` policy or equivalent permissions
- Request model access through the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)

## Available Models

### Google Gemini Models
- `gemini-2.0-flash` (recommended)
- `gemini-1.5-pro`
- `gemini-1.5-flash`

### AWS Bedrock Models
- `anthropic.claude-3-5-sonnet-20241022-v2:0` (recommended)
- `anthropic.claude-3-5-haiku-20241022-v1:0`
- `anthropic.claude-3-opus-20240229-v1:0`
- `meta.llama3-70b-instruct-v1:0`
- `mistral.mistral-large-2402-v1:0`

See [AWS Bedrock Models](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) for full list.

## Testing

After configuration, build and run:

```bash
npm install
npm run build
npm start
```

## Observability

All tracing attributes are provider-agnostic. OpenTelemetry traces show:
- `gen_ai.system`: Provider name (google/bedrock)
- `gen_ai.request.model`: Actual model being used
- Span names: `llm.chat` and `llm.generate.{iteration}`

## Implementation Details

### Migration from multi-llm-ts to Vercel AI SDK

- **Library**: Replaced `multi-llm-ts` with Vercel AI SDK (`ai` package)
- **Providers**: Using `@ai-sdk/google` and `@ai-sdk/amazon-bedrock`
- **Streaming**: Using `streamText()` function from Vercel AI SDK
- **Tools**: Integrated directly in `llm.ts` using Vercel AI SDK's tool format with Zod schemas
- **Plugins**: Removed separate plugin files, tools now defined inline
- **File renamed**: `src/model/gemini.ts` → `src/model/llm.ts`
- **Backward compatibility**: Defaults to Google Gemini if `LLM_PROVIDER` is not set

### Tool Support

Built-in tools available to the AI:
- `bash` - Execute bash commands
- `read_file` - Read file contents
- `write_file` - Write content to files
- `edit_file` - Edit files by replacing specific strings
- `list_directory` - List directory contents
- `git` - Execute git commands
- `grep` - Search for patterns in files using ripgrep
- `glob` - Find files matching glob patterns
- `github_pr` - Interact with GitHub Pull Requests (requires gh CLI)

All tools work with both providers through Vercel AI SDK's unified interface.
