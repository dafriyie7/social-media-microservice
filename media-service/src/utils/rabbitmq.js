import amqp from "amqplib";
import logger from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "social-media-events";

async function connectToRabbitmq() {
	try {
		if (channel) return channel;

		connection = await amqp.connect(process.env.RABBITMQ_URI);
		channel = await connection.createChannel();

		await channel.assertExchange(EXCHANGE_NAME, "topic", {
			durable: false,
		});

		logger.info("connected to rabbitmq");

		connection.on("close", () => {
			logger.error("rabbitmq connection closed");
			connection = null;
			channel = null;
		});

		return channel;
	} catch (error) {
		logger.error("error connecting to rabbitmq", error);
	}
}

async function publishEvent(routingKey, message) {
	try {
		if (!channel) await connectToRabbitmq();

		channel.publish(
			EXCHANGE_NAME,
			routingKey,
			Buffer.from(JSON.stringify(message))
		);

		logger.info(`event published: ${routingKey}`);
	} catch (error) {
		logger.error("error publishing to rabbitmq", error);
	}
}

async function consumeEvent(routingKey, callback) {
	try {
		if (!channel) await connectToRabbitmq();

		const { queue } = await channel.assertQueue("", { exclusive: true });

		await channel.bindQueue(queue, EXCHANGE_NAME, routingKey);

		await channel.consume(queue, (msg) => {
			if (!msg) return;
			const data = JSON.parse(msg.content.toString());
			callback(data);
			channel.ack(msg);
		});

		logger.info(`consumer started: ${routingKey}`);
	} catch (error) {
		logger.error("error consuming rabbitmq", error);
	}
}

export { connectToRabbitmq, publishEvent, consumeEvent };
