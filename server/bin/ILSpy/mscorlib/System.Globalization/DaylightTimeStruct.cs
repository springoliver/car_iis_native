namespace System.Globalization;

internal struct DaylightTimeStruct(DateTime start, DateTime end, TimeSpan delta)
{
	public DateTime Start { get; } = start;

	public DateTime End { get; } = end;

	public TimeSpan Delta { get; } = delta;
}
