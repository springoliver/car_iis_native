using System;
using ADVMobileApi.Core.Enums;

namespace ADVMobileApi.Core.Models.Responses;

public class ADVLoginResponse
{
	public int TennantId { get; set; }

	public Guid UserId { get; set; }

	public string RoleType { get; set; }

	public LoginStatus LoginStatus { get; set; }

	public string UserName { get; set; }
}
