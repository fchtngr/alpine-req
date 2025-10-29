# Alpine.js x-req

A lightweight Alpine.js plugin for components that need to fetch JSON data. It provides a declarative way to make requests directly from your HTML using the `x-req` directive.

> Built this for a side project and figured it might save someone else some time too!

## Features

- 🚀 **Declarative HTTP requests** - GET, POST, PUT, DELETE, PATCH support via modifiers
- ⚡ **Event-driven lifecycle** - Track request lifecycle with `x-req:before`, `x-req:after`, `x-req:ok`, `x-req:err` events
- 🎯 **Flexible triggers** - Support for multiple event triggers (click, submit, alpine:init, custom events, etc.)
- 🎨 **Alpine-native handlers** - Use standard Alpine event syntax (`@x-req:ok`, `@x-req:err`)
- 📦 **Dynamic request bodies** - Reactive body content with `x-req-body` using `evaluateLater`
- 🔧 **Custom headers** - Add authentication and custom headers with `x-req-headers`
- 🌐 **Event modifiers** - Built-in support for `.prevent` and `.stop` on triggers
- ✨ **Server-driven events** - Trigger Alpine events from server responses via `x-trigger` header
- 🎯 **Clean syntax** - No quotes needed for static URLs, template literals for dynamic ones

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
  post: null
}">
  <button x-req="/api/posts/1" 
          @x-req:before="loading = true"
          @x-req:after="loading = false"
          @x-req:ok="post = $event.detail"
          @x-req:err="console.error($event.detail.error)"
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

## Events

The plugin dispatches the following events during the request lifecycle:

### `x-req:before`
Fired before the request starts.

```html
<button x-req="/api/data" 
        @x-req:before="loading = true">
```

### `x-req:after`
Fired after the request completes (success or error).

```html
<button x-req="/api/data" 
        @x-req:after="loading = false">
```

### `x-req:ok`
Fired on successful response. Response data is available in `$event.detail`.

```html
<button x-req="/api/posts/1" 
        @x-req:ok="post = $event.detail">
```

Or call a function:

```html
<div x-data="{ 
  handleSuccess(event) { 
    console.log(event.detail) 
  } 
}">
  <button x-req="/api/data" 
          @x-req:ok="handleSuccess">
```

### `x-req:err`
Fired on request error. Error details are in `$event.detail.error` and response in `$event.detail.response`.

```html
<button x-req="/api/data" 
        @x-req:err="console.error($event.detail.error)">
```

### Event Bubbling

All events bubble by default, allowing you to handle them on parent elements:

```html
<div x-data="{ loading: false }"
     @x-req:before="loading = true"
     @x-req:after="loading = false">
  
  <button x-req="/api/posts/1">Load Post 1</button>
  <button x-req="/api/posts/2">Load Post 2</button>
  
  <div x-show="loading">Loading...</div>
</div>
```

Use `.stop` to prevent bubbling if needed:

```html
<button x-req="/api/data" 
        @x-req:ok.stop="post = $event.detail">
```

## URL Syntax

### Static URLs (No Quotes Needed!)

```html
<button x-req="/api/posts/1">Load Post</button>
<button x-req="https://api.example.com/data">Load External Data</button>
```

### Dynamic URLs (Template Literals)

```html
<div x-data="{ postId: 1 }">
  <button x-req="`/api/posts/${postId}`">Load Post</button>
</div>
```

The plugin automatically detects template literals (starting with `` ` ``) and evaluates them reactively using Alpine's `evaluateLater`.

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
  <button x-req.post="/api/items"
          x-req-body="{name: newItem}"
          @x-req:ok="items.push($event.detail)">
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
  <button x-req.post="/api/items"
          x-req-body="{name: newItem}">
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
- `x-req="endpoint"` - The URL to fetch (required). No quotes needed for static URLs, use template literals for dynamic ones.
- `x-req-body="{...}"` - Request body (reactive, evaluated on each request using `evaluateLater`)
- `x-req-headers="{...}"` - Custom headers (reactive, evaluated on each request)
- `x-req-trigger="@event @event.modifier"` - When to trigger (default: `@click`)

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

**Events:**
- `@x-req:before` - Request is about to start
- `@x-req:after` - Request completed (always fires, regardless of success/error)
- `@x-req:ok` - Request succeeded (response data in `$event.detail`)
- `@x-req:err` - Request failed (error info in `$event.detail`)

## More Examples

### POST with Form Data

```html
<div x-data="{ 
  form: { title: '', body: '' },
  submitting: false 
}">
  <form @submit.prevent="$refs.submitBtn.click()">
    <input x-model="form.title" placeholder="Title">
    <textarea x-model="form.body" placeholder="Body"></textarea>
    
    <button x-ref="submitBtn"
            x-req.post="/api/posts"
            x-req-body="form"
            x-req-trigger="@click.prevent"
            @x-req:before="submitting = true"
            @x-req:after="submitting = false"
            @x-req:ok="alert('Post created!'); form = {title: '', body: ''}"
            @x-req:err="alert('Error creating post')"
            :disabled="submitting">
      <span x-show="!submitting">Submit</span>
      <span x-show="submitting">Submitting...</span>
    </button>
  </form>
</div>
```

### Auto-load on Init

```html
<div x-data="{ users: [] }">
  <div x-req="/api/users"
       x-req-trigger="@alpine:init.window"
       @x-req:ok="users = $event.detail">
  </div>
  
  <ul>
    <template x-for="user in users">
      <li x-text="user.name"></li>
    </template>
  </ul>
</div>
```

### Dynamic URL with Template Literal

```html
<div x-data="{ userId: 1 }">
  <input type="number" x-model="userId" min="1">
  <button x-req="`/api/users/${userId}`"
          @x-req:ok="console.log($event.detail)">
    Load User
  </button>
</div>
```

### Custom Headers (Authentication)

```html
<div x-data="{ token: 'abc123' }">
  <button x-req="/api/protected"
          x-req-headers="{ 'Authorization': `Bearer ${token}` }"
          @x-req:ok="console.log($event.detail)">
    Load Protected Data
  </button>
</div>
```

See [test-req.html](test-req.html) for comprehensive examples.

## License

MIT

## Author

[@fchtngr](https://github.com/fchtngr)
