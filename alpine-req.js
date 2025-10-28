document.addEventListener('alpine:init', () => {
    Alpine.directive('req', (el, { expression, modifiers }, { evaluate }) => {
        const DEBUG = true;
        const log = (...args) => DEBUG && console.log('[x-req]', ...args);

        log('Initialized on element:', el, 'expression:', expression, 'modifiers:', modifiers);

        // Parse method from modifiers, expression is the endpoint
        let method = 'GET';
        modifiers.forEach(mod => {
            if (['post', 'put', 'delete', 'patch', 'get'].includes(mod)) {
                method = mod.toUpperCase();
            }
        });

        const endpoint = expression;

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

        log('Parsed method:', method, 'endpoint:', endpoint, 'triggers:', triggers);

        const makeRequest = async (event) => {
            const $data = Alpine.$data(el);

            // Get loading indicator variable name
            const indicatorAttr = el.getAttribute('x-req-indicator');

            // Set loading to true
            if (indicatorAttr) {
                const varName = indicatorAttr.trim();
                if (varName && varName in $data) {
                    $data[varName] = true;
                    log('Set loading indicator:', varName, '= true');
                }
            }

            try {
                // Evaluate endpoint (in case it's dynamic)
                const finalEndpoint = evaluate(endpoint);

                // Get body from x-req-body attribute
                let body = null;
                const bodyAttr = el.getAttribute('x-req-body');
                if (bodyAttr) {
                    body = evaluate(bodyAttr);
                }

                // Get headers from x-req-headers attribute
                let headers = {};
                const headersAttr = el.getAttribute('x-req-headers');
                if (headersAttr) {
                    headers = evaluate(headersAttr);
                }

                log('Making request to:', finalEndpoint, 'method:', method, 'body:', body);

                const response = await fetch(finalEndpoint, {
                    method,
                    headers: headers || {},
                    body: body ? JSON.stringify(body) : undefined,
                });

                log('Response status:', response.status);

                if (!response.ok) {
                    log('Response not ok, calling error handler');
                    const errAttr = el.getAttribute('x-req-err');
                    if (errAttr) {
                        const errorHandler = $data[errAttr];
                        if (typeof errorHandler === 'function') {
                            errorHandler.call($data, response);
                        } else {
                            console.error('x-req-err must reference a function, got:', typeof errorHandler);
                        }
                    }
                    return;
                }

                const data = await response.json();
                log('Response data:', data);

                const okAttr = el.getAttribute('x-req-ok');
                if (okAttr) {
                    log('Calling success handler');
                    // Get the function from the Alpine component's data
                    const successHandler = $data[okAttr];
                    if (typeof successHandler === 'function') {
                        successHandler.call($data, data);
                    } else {
                        console.error('x-req-ok must reference a function, got:', typeof successHandler);
                    }
                }

                // Handle x-trigger header
                const triggerHeader = response.headers.get('x-trigger');
                if (triggerHeader) {
                    log('x-trigger header found:', triggerHeader);
                    try {
                        const triggerData = JSON.parse(triggerHeader);
                        if (typeof triggerData === 'object' && triggerData !== null) {
                            Object.entries(triggerData).forEach(([event, detail]) => {
                                log('Dispatching object event:', event, detail);
                                el.dispatchEvent(new CustomEvent(event, { detail }));
                            });
                        } else {
                            log('Dispatching string event:', triggerData);
                            el.dispatchEvent(new CustomEvent(triggerData, { detail: data }));
                        }
                    } catch (e) {
                        log('x-trigger not JSON, treating as string event:', triggerHeader);
                        el.dispatchEvent(new CustomEvent(triggerHeader, { detail: data }));
                    }
                }
            } catch (error) {
                log('Fetch error:', error);
                const errAttr = el.getAttribute('x-req-err');
                if (errAttr) {
                    const errorHandler = $data[errAttr];
                    if (typeof errorHandler === 'function') {
                        errorHandler.call($data, response);
                    } else {
                        console.error('x-req-err must reference a function, got:', typeof errorHandler);
                    }
                }
            } finally {
                // Set loading to false
                if (indicatorAttr) {
                    const varName = indicatorAttr.trim();
                    if (varName && varName in $data) {
                        $data[varName] = false;
                        log('Set loading indicator:', varName, '= false');
                    }
                }
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
