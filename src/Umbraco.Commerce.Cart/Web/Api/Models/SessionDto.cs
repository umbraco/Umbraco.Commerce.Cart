using Microsoft.AspNetCore.Mvc;

namespace Umbraco.Commerce.Cart.Web.Api.Models;

public class SessionDto
{
    [FromHeader(Name = "Accept-Language")]
    public string? Language { get; set; }
}