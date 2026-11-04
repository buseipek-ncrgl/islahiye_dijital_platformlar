using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Education.Api.Hubs;

public sealed class EducationHub(EducationDbContext db) : Hub
{
    public async Task JoinChannel(string channelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
    }

    public async Task LeaveChannel(string channelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
    }

    public async Task SendChannelMessage(Guid channelId, string content)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous-user";
        var user = await db.Users.FindAsync(userId);
        var senderName = user?.DisplayName ?? "Kullanıcı";

        var msg = new ChannelMessageEntity
        {
            ChannelId = channelId,
            SenderUserId = userId,
            SenderName = senderName,
            Content = content.Trim()
        };

        db.ChannelMessages.Add(msg);
        await db.SaveChangesAsync();

        var response = new ChannelMessageResponse(
            msg.Id,
            msg.ChannelId,
            msg.SenderUserId,
            msg.SenderName,
            msg.Content,
            msg.CreatedAt
        );

        await Clients.Group(channelId.ToString()).SendAsync("ReceiveChannelMessage", response);
    }

    public async Task SendDirectMessage(string receiverUserId, string receiverName, string content)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous-user";
        var user = await db.Users.FindAsync(userId);
        var senderName = user?.DisplayName ?? "Kullanıcı";

        var msg = new DirectMessageEntity
        {
            SenderUserId = userId,
            SenderName = senderName,
            ReceiverUserId = receiverUserId,
            ReceiverName = receiverName,
            Content = content.Trim()
        };

        db.DirectMessages.Add(msg);
        await db.SaveChangesAsync();

        var response = new DirectMessageResponse(
            msg.Id,
            msg.SenderUserId,
            msg.SenderName,
            msg.ReceiverUserId,
            msg.ReceiverName,
            msg.Content,
            msg.CreatedAt,
            msg.ReadAt
        );

        // Send to caller and receiver
        await Clients.User(receiverUserId).SendAsync("ReceiveDirectMessage", response);
        await Clients.Caller.SendAsync("ReceiveDirectMessage", response);
    }
}

