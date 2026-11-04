using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1")]
public sealed class MessagesController(EducationDbContext db) : ControllerBase
{
    // Channels
    [HttpGet("channels")]
    public async Task<ActionResult<IReadOnlyList<ChannelResponse>>> ListChannels()
    {
        var list = await db.Channels.AsNoTracking().Include(x => x.Messages).OrderBy(x => x.Name).ToListAsync();
        return Ok(list.Select(x => new ChannelResponse(
            x.Id,
            x.Name,
            x.Description,
            x.Type,
            x.GroupId,
            x.CreatedByUserId,
            x.IsArchived,
            x.Messages.Count,
            x.CreatedAt
        )).ToList());
    }

    [HttpPost("channels")]
    public async Task<ActionResult<ChannelResponse>> CreateChannel(ChannelWriteRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";

        var item = new ChannelEntity
        {
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Type = request.Type,
            GroupId = request.GroupId,
            CreatedByUserId = userId
        };

        db.Channels.Add(item);
        await db.SaveChangesAsync();

        return Created($"/api/v1/channels/{item.Id}", new ChannelResponse(
            item.Id,
            item.Name,
            item.Description,
            item.Type,
            item.GroupId,
            item.CreatedByUserId,
            item.IsArchived,
            0,
            item.CreatedAt
        ));
    }

    [HttpGet("channels/{id:guid}/messages")]
    public async Task<ActionResult<IReadOnlyList<ChannelMessageResponse>>> GetChannelMessages(Guid id)
    {
        var list = await db.ChannelMessages.AsNoTracking()
            .Where(x => x.ChannelId == id)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        return Ok(list.Select(x => new ChannelMessageResponse(
            x.Id,
            x.ChannelId,
            x.SenderUserId,
            x.SenderName,
            x.Content,
            x.CreatedAt
        )).ToList());
    }

    [HttpPost("channels/{id:guid}/messages")]
    public async Task<ActionResult<ChannelMessageResponse>> SendChannelMessage(Guid id, ChannelMessageRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "user";
        var user = await db.Users.FindAsync(userId);
        var senderName = user?.DisplayName ?? "Kullanıcı";

        var msg = new ChannelMessageEntity
        {
            ChannelId = id,
            SenderUserId = userId,
            SenderName = senderName,
            Content = request.Content.Trim()
        };

        db.ChannelMessages.Add(msg);
        await db.SaveChangesAsync();

        return Created($"/api/v1/channels/{id}/messages/{msg.Id}", new ChannelMessageResponse(
            msg.Id,
            msg.ChannelId,
            msg.SenderUserId,
            msg.SenderName,
            msg.Content,
            msg.CreatedAt
        ));
    }

    // Direct Messages
    [HttpGet("messages/direct")]
    public async Task<ActionResult<IReadOnlyList<DirectMessageResponse>>> GetDirectMessages([FromQuery] string user1, [FromQuery] string user2)
    {
        var list = await db.DirectMessages.AsNoTracking()
            .Where(x => (x.SenderUserId == user1 && x.ReceiverUserId == user2) || (x.SenderUserId == user2 && x.ReceiverUserId == user1))
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        return Ok(list.Select(x => new DirectMessageResponse(
            x.Id,
            x.SenderUserId,
            x.SenderName,
            x.ReceiverUserId,
            x.ReceiverName,
            x.Content,
            x.CreatedAt,
            x.ReadAt
        )).ToList());
    }

    [HttpPost("messages/direct")]
    public async Task<ActionResult<DirectMessageResponse>> SendDirectMessage(DirectMessageRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "user";
        var user = await db.Users.FindAsync(userId);
        var senderName = user?.DisplayName ?? "Kullanıcı";

        var msg = new DirectMessageEntity
        {
            SenderUserId = userId,
            SenderName = senderName,
            ReceiverUserId = request.ReceiverUserId,
            ReceiverName = request.ReceiverName,
            Content = request.Content.Trim()
        };

        db.DirectMessages.Add(msg);
        await db.SaveChangesAsync();

        return Created($"/api/v1/messages/direct/{msg.Id}", new DirectMessageResponse(
            msg.Id,
            msg.SenderUserId,
            msg.SenderName,
            msg.ReceiverUserId,
            msg.ReceiverName,
            msg.Content,
            msg.CreatedAt,
            msg.ReadAt
        ));
    }
}

