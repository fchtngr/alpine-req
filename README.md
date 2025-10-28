# Alpine.js x-req

A lightweight Alpine.js plugin that provides a declarative way to make HTTP requests directly from your HTML using the `x-req` directive.

## Features

- 🚀 **Declarative HTTP requests** - GET, POST, PUT, DELETE, PATCH support via modifiers
- ⚡ **Loading state management** - Automatic loading indicators with `x-req-indicator`
- 🎯 **Flexible triggers** - Support for multiple event triggers (click, submit, alpine:init, custom events, etc.)
- 🎨 **Clean handler functions** - Success and error callbacks via `x-req-ok` and `x-req-err`
- 📦 **Dynamic request bodies** - Reactive body content with `x-req-body`
- 🔧 **Custom headers** - Add authentication and custom headers with `x-req-headers`
- 🌐 **Event modifiers** - Built-in support for `.prevent` and `.stop` on triggers

## Installation

Include the plugin after Alpine.js:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script defer src="alpine-req.js"></script>
```

## Quick example
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
