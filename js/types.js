/**
 * @typedef {Object} MapConfig
 * @property {string} apiKey - Google Maps API key
 * @property {Object} defaultLocation - Default map center location
 * @property {number} defaultLocation.lat - Latitude
 * @property {number} defaultLocation.lng - Longitude
 * @property {number} defaultZoom - Default zoom level
 */

/**
 * @typedef {Object} OrderStatus
 * @property {string} id - Order ID
 * @property {'pending'|'confirmed'|'preparing'|'dispatched'|'delivered'} status - Current order status
 * @property {Date} timestamp - Status update timestamp
 * @property {string} message - Status message
 */

/**
 * @typedef {Object} DeliveryAgent
 * @property {string} id - Agent ID
 * @property {string} name - Agent name
 * @property {string} phone - Agent phone number
 * @property {Object} location - Current location
 * @property {number} location.lat - Latitude
 * @property {number} location.lng - Longitude
 */

/**
 * @typedef {Object} LocationUpdate
 * @property {string} orderId - Order ID
 * @property {string} agentId - Delivery agent ID
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} [duration] - Estimated duration to destination
 */

/**
 * @typedef {Object} SocketConfig
 * @property {string} url - Socket.IO server URL
 * @property {Object} options - Socket.IO connection options
 * @property {boolean} options.reconnection - Whether to reconnect automatically
 * @property {number} options.reconnectionAttempts - Number of reconnection attempts
 * @property {number} options.reconnectionDelay - Delay between reconnection attempts
 * @property {number} options.timeout - Connection timeout
 */ 