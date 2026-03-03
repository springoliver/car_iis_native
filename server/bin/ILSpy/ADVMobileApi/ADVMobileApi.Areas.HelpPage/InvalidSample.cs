using System;

namespace ADVMobileApi.Areas.HelpPage;

public class InvalidSample
{
	public string ErrorMessage { get; private set; }

	public InvalidSample(string errorMessage)
	{
		if (errorMessage == null)
		{
			throw new ArgumentNullException("errorMessage");
		}
		ErrorMessage = errorMessage;
	}

	public override bool Equals(object obj)
	{
		if (obj is InvalidSample other)
		{
			return ErrorMessage == other.ErrorMessage;
		}
		return false;
	}

	public override int GetHashCode()
	{
		return ErrorMessage.GetHashCode();
	}

	public override string ToString()
	{
		return ErrorMessage;
	}
}
