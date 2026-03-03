using System.Security;
using System.Security.Permissions;
using System.Threading.Tasks;

namespace System.Runtime.CompilerServices;

[__DynamicallyInvokable]
public struct ConfiguredTaskAwaitable(Task task, bool continueOnCapturedContext)
{
	[__DynamicallyInvokable]
	[HostProtection(SecurityAction.LinkDemand, Synchronization = true, ExternalThreading = true)]
	public struct ConfiguredTaskAwaiter(Task task, bool continueOnCapturedContext) : ICriticalNotifyCompletion, INotifyCompletion
	{
		private readonly Task m_task = task;

		private readonly bool m_continueOnCapturedContext = continueOnCapturedContext;

		[__DynamicallyInvokable]
		public bool IsCompleted
		{
			[__DynamicallyInvokable]
			get
			{
				return m_task.IsCompleted;
			}
		}

		[SecuritySafeCritical]
		[__DynamicallyInvokable]
		public void OnCompleted(Action continuation)
		{
			TaskAwaiter.OnCompletedInternal(m_task, continuation, m_continueOnCapturedContext, flowExecutionContext: true);
		}

		[SecurityCritical]
		[__DynamicallyInvokable]
		public void UnsafeOnCompleted(Action continuation)
		{
			TaskAwaiter.OnCompletedInternal(m_task, continuation, m_continueOnCapturedContext, flowExecutionContext: false);
		}

		[__DynamicallyInvokable]
		public void GetResult()
		{
			TaskAwaiter.ValidateEnd(m_task);
		}
	}

	private readonly ConfiguredTaskAwaiter m_configuredTaskAwaiter = new ConfiguredTaskAwaiter(task, continueOnCapturedContext);

	[__DynamicallyInvokable]
	public ConfiguredTaskAwaiter GetAwaiter()
	{
		return m_configuredTaskAwaiter;
	}
}
[__DynamicallyInvokable]
public struct ConfiguredTaskAwaitable<TResult>(Task<TResult> task, bool continueOnCapturedContext)
{
	[__DynamicallyInvokable]
	[HostProtection(SecurityAction.LinkDemand, Synchronization = true, ExternalThreading = true)]
	public struct ConfiguredTaskAwaiter(Task<TResult> task, bool continueOnCapturedContext) : ICriticalNotifyCompletion, INotifyCompletion
	{
		private readonly Task<TResult> m_task = task;

		private readonly bool m_continueOnCapturedContext = continueOnCapturedContext;

		[__DynamicallyInvokable]
		public bool IsCompleted
		{
			[__DynamicallyInvokable]
			get
			{
				return m_task.IsCompleted;
			}
		}

		[SecuritySafeCritical]
		[__DynamicallyInvokable]
		public void OnCompleted(Action continuation)
		{
			TaskAwaiter.OnCompletedInternal(m_task, continuation, m_continueOnCapturedContext, flowExecutionContext: true);
		}

		[SecurityCritical]
		[__DynamicallyInvokable]
		public void UnsafeOnCompleted(Action continuation)
		{
			TaskAwaiter.OnCompletedInternal(m_task, continuation, m_continueOnCapturedContext, flowExecutionContext: false);
		}

		[__DynamicallyInvokable]
		public TResult GetResult()
		{
			TaskAwaiter.ValidateEnd(m_task);
			return m_task.ResultOnSuccess;
		}
	}

	private readonly ConfiguredTaskAwaiter m_configuredTaskAwaiter = new ConfiguredTaskAwaiter(task, continueOnCapturedContext);

	[__DynamicallyInvokable]
	public ConfiguredTaskAwaiter GetAwaiter()
	{
		return m_configuredTaskAwaiter;
	}
}
