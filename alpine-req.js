document.addEventListener('alpine:init', () => {
    Alpine.directive('req', (el, { expression, modifiers }, { evaluateLater, evaluate }) => {
        const DEBUG = true;
        const log = (...args) => DEBUG && console.log('[x-req]', ...args);

        log('Initialized on element:', el, 'expression:', expression, 'modifiers:', modifiers);

        // Parse method from modifiers
        let method = 'GET';
        modifiers.forEach(mod => {
            if (['post', 'put', 'delete', 'patch', 'get'].includes(mod)) {
                method = mod.toUpperCase();
            }
        });

        // Smart endpoint evaluation
        let getEndpoint;
        if (expression.startsWith('`')) {
            // Template literal - use evaluateLater for reactivity
            getEndpoint = evaluateLater(expression);
        } else {
            // Static string - use as-is
            const staticEndpoint = expression;
            getEndpoint = (callback) => callback(staticEndpoint);
        }

        // Setup body evaluator
        let getBody = null;
        const bodyAttr = el.getAttribute('x-req-body');
        if (bodyAttr) {
            getBody = evaluateLater(bodyAttr);
        }

        // Setup headers evaluator
        let getHeaders = null;
        const headersAttr = el.getAttribute('x-req-headers');
        if (headersAttr) {
            getHeaders = evaluateLater(headersAttr);
        }

        // Parse triggers from x-req-trigger attribute
        let triggers = [];
        const triggerAttr = el.getAttribute('x-req-trigger');

        if (triggerAttr) {
            const triggerDefs = triggerAttr.trim().split(/\s+/);

            triggerDefs.forEach(def => {
                if (!def.startsWith('@')) {
                    console.warn('x-req-trigger: triggers must start with @, got:', def);
                    return;
                }

                const parts = def.slice(1).split('.');
                const event = parts[0];
                let target = el;
                let prevent = false;
                let stop = false;

                parts.slice(1).forEach(mod => {
                    if (mod === 'window') {
                        target = window;
                    } else if (mod === 'document') {
                        target = document;
                    } else if (mod === 'prevent') {
                        prevent = true;
                    } else if (mod === 'stop') {
                        stop = true;
                    }
                });

                triggers.push({ event, target, prevent, stop });
            });
        } else {
            triggers.push({ event: 'click', target: el, prevent: false, stop: false });
        }

        log('Parsed method:', method, 'triggers:', triggers);

        const makeRequest = async (event) => {
            try {
                // Dispatch before event
                log('Dispatching x-req:before event');
                el.dispatchEvent(new CustomEvent('x-req:before', {
                    bubbles: true
                }));

                // Get the endpoint (will be evaluated if it's a template literal)
                let finalEndpoint;
                getEndpoint(value => finalEndpoint = value);

                // Get body (evaluated at request time)
                let body = null;
                if (getBody) {
                    getBody(value => body = value);
                }

                // Get headers (evaluated at request time)
                let headers = {};
                if (getHeaders) {
                    getHeaders(value => headers = value);
                }

                log('Making request to:', finalEndpoint, 'method:', method, 'body:', body);

                const response = await fetch(finalEndpoint, {
                    method,
                    headers: headers || {},
                    body: body ? JSON.stringify(body) : undefined,
                });

                log('Response status:', response.status);

                if (!response.ok) {
                    log('Response not ok, dispatching x-req:err event');
                    el.dispatchEvent(new CustomEvent('x-req:err', {
                        detail: { response, error: new Error(`HTTP ${response.status}`) },
                        bubbles: true
                    }));
                    return;
                }

                const data = await response.json();
                log('Response data:', data);

                // Dispatch success event
                log('Dispatching x-req:ok event');
                el.dispatchEvent(new CustomEvent('x-req:ok', {
                    detail: data,
                    bubbles: true
                }));

                // Handle x-trigger header
                const triggerHeader = response.headers.get('x-trigger');
                if (triggerHeader) {
                    log('x-trigger header found:', triggerHeader);
                    try {
                        const triggerData = JSON.parse(triggerHeader);
                        if (typeof triggerData === 'object' && triggerData !== null) {
                            Object.entries(triggerData).forEach(([event, detail]) => {
                                log('Dispatching object event:', event, detail);
                                el.dispatchEvent(new CustomEvent(event, { detail, bubbles: true }));
                            });
                        } else {
                            log('Dispatching string event:', triggerData);
                            el.dispatchEvent(new CustomEvent(triggerData, { detail: data, bubbles: true }));
                        }
                    } catch (e) {
                        log('x-trigger not JSON, treating as string event:', triggerHeader);
                        el.dispatchEvent(new CustomEvent(triggerHeader, { detail: data, bubbles: true }));
                    }
                }
            } catch (error) {
                log('Fetch error:', error);
                el.dispatchEvent(new CustomEvent('x-req:err', {
                    detail: { error },
                    bubbles: true
                }));
            } finally {
                // Dispatch after event
                log('Dispatching x-req:after event');
                el.dispatchEvent(new CustomEvent('x-req:after', {
                    bubbles: true
                }));
            }
        };

        triggers.forEach(({ event, target, prevent, stop }) => {
            log('Adding event listener for:', event, 'on', target, 'prevent:', prevent, 'stop:', stop);

            const handler = (e) => {
                if (prevent) e.preventDefault();
                if (stop) e.stopPropagation();
                makeRequest(e);
            };

            target.addEventListener(event, handler);
        });
    });
});
