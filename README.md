# Alpine.js x-req

A lightweight Alpine.js plugin for components that need to fetch JSON data. It provides a declarative way to make requests directly from your HTML using the `x-req` directive.

> Built this for a side project and figured it might save someone else some time too!

## Features

- 🚀 **Declarative HTTP requests** - GET, POST, PUT, DELETE, PATCH support via modifiers
- ⚡ **Loading state management** - Automatic loading indicators with `x-req-indicator`
- 🎯 **Flexible triggers** - Support for multiple event triggers (click, submit, alpine:init, custom events, etc.)
- 🎨 **Clean handler functions** - Success and error callbacks via `x-req-ok` and `x-req-err`
- 📦 **Dynamic request bodies** - Reactive body content with `x-req-body`
- 🔧 **Custom headers** - Add authentication and custom headers with `x-req-headers`
- 🌐 **Event modifiers** - Built-in support for `.prevent` and `.stop` on triggers
- ✨ **Server-driven events** - Trigger Alpine events from server responses via `x-trigger` header

## Installation

Include the plugin after Alpine.js:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="alpine-req.js"></script>
```

## Quick Example

```html
<div x-data="{ 
  loading: false, 
  post: null,
  handlePost(data) { this.post = data; }
}">
  <button x-req="'/api/posts/1'" 
          x-req-indicator="loading"
          x-req-ok="handlePost"
          :disabled="loading">
    <span x-show="!loading">Load Post</span>
    <span x-show="loading">Loading...</span>
  </button>
  
  <div x-show="post">
    <h3 x-text="post?.title"></h3>
    <p x-text="post?.body"></p>
  </div>
</div>
```

## Server-Driven Events (x-trigger Header)

The plugin supports server-driven events through the `x-trigger` response header, allowing your backend to trigger Alpine.js events after a successful request.

### Single Event

Your server can return a simple string to trigger an event:

**Server Response:**
```http
HTTP/1.1 200 OK
x-trigger: refresh-list
Content-Type: application/json

{"id": 123, "name": "New Item"}
```

**HTML:**
```html
<div x-data="{ items: [] }" 
     @refresh-list.window="loadItems()">
  <button x-req.post="'/api/items'"
          x-req-body="{name: newItem}"
          x-req-ok="handleSuccess">
    Add Item
  </button>
</div>
```

### Multiple Events with Data

You can also send a JSON object to trigger multiple events with custom data:

**Server Response:**
```http
HTTP/1.1 200 OK
x-trigger: {"show-notification": {"type": "success", "message": "Item created!"}, "refresh-list": {"animate": true}}
Content-Type: application/json

{"id": 123, "name": "New Item"}
```

**HTML:**
```html
<div x-data="{ notification: null }" 
     @show-notification="notification = $event.detail"
     @refresh-list="loadItems($event.detail.animate)">
  <button x-req.post="'/api/items'"
          x-req-body="{name: newItem}"
          x-req-ok="handleSuccess">
    Add Item
  </button>
  
  <div x-show="notification" 
       :class="notification?.type"
       x-text="notification?.message">
  </div>
</div>
```

### Use Cases

- **Notifications**: Show success/error messages after operations
- **UI Updates**: Refresh lists, charts, or other components
- **State Changes**: Update application state from server responses
- **Analytics**: Track user actions server-side and trigger client events
- **Workflow Orchestration**: Chain multiple UI updates from a single request

This pattern is inspired by htmx's `HX-Trigger` header and provides a clean way to coordinate client-side behavior from your backend.

## API Reference

### Directive: `x-req[.method]`

**Attributes:**
- `x-req="endpoint"` - The URL to fetch (required)
- `x-req-body="{...}"` - Request body (reactive, evaluated on each request)
- `x-req-headers="{...}"` - Custom headers (reactive)
- `x-req-trigger="@event @event.modifier"` - When to trigger (default: `@click`)
- `x-req-ok="functionName"` - Success handler function reference
- `x-req-err="functionName"` - Error handler function reference
- `x-req-indicator="varName"` - Boolean variable to track loading state

**Modifiers:**
- `.get` - GET request (default)
- `.post` - POST request
- `.put` - PUT request
- `.delete` - DELETE request
- `.patch` - PATCH request

**Trigger Modifiers:**
- `.prevent` - Calls `event.preventDefault()`
- `.stop` - Calls `event.stopPropagation()`
- `.window` - Listen on window object
- `.document` - Listen on document object

## More Examples

See [test-req.html](test-req.html) for comprehensive examples including:
- Basic GET requests with loading indicators
- POST requests with form data
- Auto-loading data on component init
- PUT/DELETE operations
- Form submission with prevent
- Error handling

## License

MIT

## Author

[@fchtngr](https://github.com/fchtngr)
```
