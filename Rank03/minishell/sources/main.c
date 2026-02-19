/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/22 15:43:54 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/19 19:47:26 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "minishell.h"
#include "../libft/libft.h"

/* Launch ./minishell, a prompt dedicated to command execution */
int	main(int argc, char **argv, char **envp)
{
	t_env	*env;
	int		exit_status;

	(void) argv;
	ft_input_check(argc);
	env = ft_env_init(envp);
	if (!env)
		return (1);
	ft_interactive_signals();
	exit_status = shell_loop(env);
	rl_clear_history();
	ft_env_free(env);
	return (exit_status);
}

void	ft_input_check(int argc)
{
	if (argc > 1)
	{
		ft_printf("Your shell was started but subsequent arguments \
were ignored");
	}
}

/* Loop keeping the shell active */
int	shell_loop(t_env *env)
{
	char	*line;
	int		exit_status;

	exit_status = 0;
	while (1)
	{
		line = readline("minishell$ ");
		if (!line)
		{
			ft_putendl_fd("exit", STDOUT_FILENO);
			break ;
		}
		if (*line)
		{
			add_history(line);
			exit_status = ft_process_line(line, env, exit_status);
		}
		free(line);
		if (env->should_exit)
		{
			exit_status = env->exit_status;
			break ;
		}
	}
	return (exit_status);
}

int	ft_process_line(char *line, t_env *env, int exit_status)
{
	t_token	*tokens;
	t_ast	*ast;
	int		parse_status;

// printf("DEBUG process_line: line='%s'\n", line);  // ← Add this
	parse_status = 0;
	tokens = ft_lex(line, &parse_status);
// printf("DEBUG: tokens=%p\n", (void *)tokens);  // ← Add this
	if (!tokens)
		return (parse_status ? parse_status : exit_status);
	ast = ms_parse(tokens, &parse_status);
// printf("DEBUG: ast=%p\n", (void *)ast);
	ft_free_tokens(&tokens);
// printf("DEBUG: ast=%p\n", ast);  // ← Add this
	if (!ast)
		return (parse_status ? parse_status : exit_status);
	if (!ft_expand_ast(ast, env, &exit_status))
	{
		ft_free_ast(ast);
		return (1);
	}
// printf("DEBUG: calling ft_exec_ast\n");  // ← Add this
	exit_status = ft_exec_ast(ast, env);
	ft_free_ast(ast);
	return (exit_status);
}
