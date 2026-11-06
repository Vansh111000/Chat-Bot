import axios from 'axios';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from './user';

interface ChatMessage {
    message: string;
    reply: string;
}

interface FormattedMessage {
    role: 'user' | 'ai';
    content: string;
}

export const useChatStore = defineStore('chat', () => {
    const messages = ref<{ role: string; content: string }[]>([]);
    const isLoading = ref(false);

    const userStore = useUserStore();

    // Load previous chat messages
    const loadChatHistory = async () => {
        if (!userStore.userId) return;

        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/get-messages`,
                {
                    userId: userStore.userId,
                }
            );

            console.log(data)

            messages.value = data.message
                .flatMap((msg: ChatMessage): FormattedMessage[] => [
                    { role: 'user', content: msg.message },
                    { role: 'ai', content: msg.reply },
                ])
                .filter((msg: FormattedMessage) => msg.content);
        } catch (error) {
            console.error('Error loading chat history: ', error);
        }
    };

    // Send new message to AI
    const sendMessage = async (message: string) => {
        // console.log(123);
        if (!message.trim() || !userStore.userId) return;

        messages.value.push({ role: 'user', content: message });

        isLoading.value = true;

        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat`,
                {
                    message,
                    userId: userStore.userId,
                    Headers:{
                        "Content-type":"Application/json"
                    }
                }
            );



            messages.value.push({ role: 'ai', content: data.reply });
        } catch (error) {
            console.error('Error sending message: ', error);
            messages.value.push({
                role: 'ai',
                content: 'Error: unable to process request',
            });
        } finally {
            isLoading.value = false;
        }
    };

    return { messages, isLoading, loadChatHistory, sendMessage };
}); 