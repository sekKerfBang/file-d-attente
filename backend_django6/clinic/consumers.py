import json
from channels.generic.websocket import AsyncWebsocketConsumer

class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to queue websocket'
        }))

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Handle incoming messages
        await self.send(text_data=json.dumps({
            'type': 'message_received',
            'data': data
        }))



# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class QueueConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         await self.channel_layer.group_add('queue_updates', self.channel_name)
#         await self.accept()
#         await self.send(text_data=json.dumps({
#             'type': 'connection',
#             'message': 'Connecté au fil d\'attente en temps réel'
#         }))
    
#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard('queue_updates', self.channel_name)
    
#     async def receive(self, text_data):
#         # Traitement des messages entrants si nécessaire
#         pass
    
#     async def queue_update(self, event):
#         await self.send(text_data=json.dumps(event['message']))