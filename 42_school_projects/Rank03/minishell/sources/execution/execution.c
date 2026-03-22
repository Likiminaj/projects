/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   execution.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/30 11:12:42 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 14:44:50 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int	ft_exec_ast(t_ast *ast, t_env *env);
int	exec_command(t_ast *ast, t_env *env);
int	exec_pipe(t_ast *ast, t_env *env);

/* Executes an AST node by dispatching to command or pipe execution. */
int	ft_exec_ast(t_ast *ast, t_env *env)
{
	if (!ast)
		return (0);
	if (ast->type == AST_COMMAND)
		return (exec_command(ast, env));
	else if (ast->type == AST_PIPE)
		return (exec_pipe(ast, env));
	return (1);
}

/* Analyses the given command and execute it.
Redirect input/output if necessary. */
int	exec_command(t_ast *ast, t_env *env)
{
	int		status;
	pid_t	pid;

	if (!ast->args || !ast->args[0])
		return (0);
	if (is_built_in(ast->args[0]) == 1)
		return (execute_built_in_redirections(ast, env));
	signal(SIGINT, SIG_IGN);
	signal(SIGQUIT, SIG_IGN);
	pid = fork();
	if ((pid) == -1)
		return (ft_interactive_signals(), perror("fork"), 1);
	if (pid == 0)
		exec_command_child(ast, env);
	waitpid(pid, &status, 0);
	ft_interactive_signals();
	return (handle_child_status(status));
}

/* Executes a pipe by forking left and right commands
with connected pipe. */
int	exec_pipe(t_ast *ast, t_env *env)
{
	int		fd[2];
	int		status;
	pid_t	pid_left;
	pid_t	pid_right;

	if (pipe(fd) == -1)
		return (perror("pipe"), 1);
	signal(SIGINT, SIG_IGN);
	signal(SIGQUIT, SIG_IGN);
	pid_left = fork();
	if (pid_left == -1)
		return (fork_error_cleanup(fd));
	if (pid_left == 0)
		exec_left(ast, env, fd);
	pid_right = fork();
	if (pid_right == -1)
		return (fork_error_cleanup(fd));
	if (pid_right == 0)
		exec_right(ast, env, fd);
	close(fd[0]);
	close(fd[1]);
	waitpid(pid_left, NULL, 0);
	waitpid(pid_right, &status, 0);
	ft_interactive_signals();
	return (handle_child_status(status));
}
