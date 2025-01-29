﻿using Microsoft.AspNetCore.Mvc;

namespace Umbraco.Commerce.Cart.Web.Api.Models;

public class StoreSessionDto : SessionDto
{
    [FromHeader(Name = "Store")]
    public string Store { get; set; }
}